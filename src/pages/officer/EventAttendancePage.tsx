import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { ChevronRight, CircleStop, Download, Maximize2, Play, QrCode, Search, UserCheck, UserPlus, UserX, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { downloadFile, getErrorMessage } from '@/api/client'
import { officerApi } from '@/api/officer'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/Feedback'
import { Field, Input, Select } from '@/components/ui/Field'
import { Avatar, PageHeader } from '@/components/ui/Misc'
import { Modal } from '@/components/ui/Modal'
import { StatCard } from '@/components/ui/StatCard'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDate, formatTime, percent, relativeTime } from '@/lib/format'
import { attendanceStatus, checkInMethod } from '@/lib/status'
import type { AttendanceStatus, CheckInCode } from '@/types'

const PAGE_SIZE = 10

function useElapsed(since: string | null) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!since) return
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [since])
  if (!since) return null
  const minutes = Math.max(0, Math.floor((now - new Date(since).getTime()) / 60000))
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`
}

/** Big QR + code. Fullscreen mode is for projecting at the venue entrance. */
function QrPanel({ code, title, fullscreen, onClose }: { code: CheckInCode; title: string; fullscreen?: boolean; onClose?: () => void }) {
  const [remaining, setRemaining] = useState(code.expires_in ?? 0)

  useEffect(() => {
    setRemaining(code.expires_in ?? 0)
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000)
    return () => clearInterval(t)
  }, [code])

  if (!code.open || !code.url) return null

  const qr = (
    <div className="rounded-2xl bg-white p-4">
      <QRCodeSVG value={code.url} size={fullscreen ? 360 : 200} level="M" className="h-auto w-full max-w-[360px]" />
    </div>
  )

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-navy-950 p-6 text-center text-white">
        <button onClick={onClose} className="absolute top-5 right-5 rounded-lg p-2 text-blue-100/70 hover:bg-white/10" aria-label="Exit fullscreen">
          <X className="size-6" />
        </button>
        <img src="/cpc-logo.png" alt="" className="size-14" />
        <p className="mt-3 text-sm font-medium text-blue-200">Scan to check in</p>
        <h2 className="mt-1 max-w-2xl text-2xl font-semibold sm:text-3xl">{title}</h2>
        <div className="mt-6 w-[min(80vw,400px)]">{qr}</div>
        <p className="mt-6 text-sm text-blue-200">Or enter this code at the Check in page</p>
        <p className="mt-1 font-mono text-5xl font-bold tracking-[0.3em]">{code.code}</p>
        <p className="mt-3 text-xs text-blue-200/70">New code in {remaining}s</p>
      </div>
    )
  }

  return (
    <div className="text-center">
      {qr}
      <p className="mt-4 text-xs text-blue-100/70">Or type this code on the Check in page</p>
      <p className="mt-1 font-mono text-3xl font-bold tracking-[0.25em] text-white">{code.code}</p>
      <div className="mx-auto mt-3 h-1 w-40 overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-emerald-400 transition-all duration-1000" style={{ width: `${((remaining || 0) / (code.period || 60)) * 100}%` }} />
      </div>
      <p className="mt-2 text-[11px] text-blue-100/60">Code refreshes in {remaining}s — screenshots expire fast</p>
    </div>
  )
}

export default function EventAttendancePage() {
  const { id = '' } = useParams()
  const eventId = Number(id)
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus>('all')
  const [page, setPage] = useState(1)
  const [walkIn, setWalkIn] = useState(false)
  const [identifier, setIdentifier] = useState('')
  const [fullscreen, setFullscreen] = useState(false)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['officer', 'attendance', id],
    queryFn: () => officerApi.attendance(id),
    refetchInterval: (q) => (q.state.data?.check_in.open ? 5000 : false),
  })
  useDocumentTitle(data ? `${data.event.title} attendance` : 'Attendance')

  const isOpen = data?.check_in.open ?? false
  const code = useQuery({
    queryKey: ['officer', 'check-in-code', id],
    queryFn: () => officerApi.checkInCode(eventId),
    enabled: isOpen,
    refetchInterval: (q) => ((q.state.data?.expires_in ?? 10) + 1) * 1000,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['officer', 'attendance', id] })
    queryClient.invalidateQueries({ queryKey: ['officer', 'check-in-code', id] })
  }

  const open = useMutation({
    mutationFn: () => officerApi.openCheckIn(eventId),
    onSuccess: () => {
      toast.success('Check-in is open. Show the QR at the entrance.')
      invalidate()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const close = useMutation({
    mutationFn: () => officerApi.closeCheckIn(eventId),
    onSuccess: () => {
      toast.success('Check-in closed.')
      setFullscreen(false)
      invalidate()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const mark = useMutation({
    mutationFn: (payload: { user_id?: number; identifier?: string; status: string }) => officerApi.mark(eventId, payload),
    onSuccess: (res) => {
      toast.success(res.message)
      setWalkIn(false)
      setIdentifier('')
      invalidate()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    return (data?.roster ?? []).filter(
      (r) => (statusFilter === 'all' || r.status === statusFilter) && (!term || r.user.name.toLowerCase().includes(term) || r.user.id_number.includes(term)),
    )
  }, [data, search, statusFilter])

  useEffect(() => setPage(1), [search, statusFilter])

  const elapsed = useElapsed(isOpen ? data?.check_in.opened_at ?? null : null)

  if (isLoading) return <PageLoader />
  if (error || !data) return <ErrorState error={error} onRetry={refetch} />

  const { event, stats } = data
  const ended = event.display_status === 'completed'
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <>
      <nav className="mb-4 flex items-center gap-1 text-xs text-slate-500" aria-label="Breadcrumb">
        <Link to="/officer/events" className="hover:text-blue-600">Events</Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-slate-700">{event.title}</span>
      </nav>

      <PageHeader
        eyebrow={`${isOpen ? 'Live attendance' : 'Attendance'} · ${formatDate(event.starts_at, { month: 'long', day: 'numeric', year: 'numeric' })}`}
        title={`${event.title}`}
        description={isOpen ? 'Monitor check-ins in real time, manage the roster and show the QR for students.' : ended ? 'Final attendance for this event. You can still correct records.' : 'Open check-in when students start arriving.'}
        actions={
          <>
            <Button variant="secondary" icon={<Download className="size-4" />} onClick={() => downloadFile(`/officer/events/${eventId}/attendance/export`, 'attendance.csv').catch((e) => toast.error(getErrorMessage(e)))}>
              Export roster
            </Button>
            {isOpen ? (
              <Button variant="danger" loading={close.isPending} icon={<CircleStop className="size-4" />} onClick={() => close.mutate()}>
                End check-in
              </Button>
            ) : (
              !ended && (
                <Button loading={open.isPending} icon={<Play className="size-4" />} onClick={() => open.mutate()}>
                  Open check-in
                </Button>
              )
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Present" value={stats.attended} hint={`${percent(stats.expected ? (stats.attended / stats.expected) * 100 : null)} of expected attendees${stats.late ? ` · ${stats.late} late` : ''}`} icon={<UserCheck />} tone="green" />
        <StatCard label={ended ? 'Absent' : 'Not yet checked in'} value={ended ? stats.absent : stats.not_checked_in} hint={stats.excused ? `${stats.excused} excused` : 'Registered or required, no check-in yet'} icon={<UserX />} tone="amber" />
        <StatCard label="Expected" value={stats.expected} hint={event.capacity ? `${Math.max(0, event.capacity - (event.registrations_count ?? 0))} open places of ${event.capacity}` : 'Registered + required members'} icon={<Users />} />
        <StatCard
          label={isOpen ? 'Check-in live' : 'Check-in'}
          value={isOpen ? (elapsed ?? '0m') : ended ? percent(stats.rate) : 'Closed'}
          hint={isOpen ? `Opened ${formatTime(data.check_in.opened_at)}` : ended ? 'Final attendance rate' : 'Not opened yet'}
          icon={<QrCode />}
          tone={isOpen ? 'blue' : 'slate'}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input type="search" className="pl-9" placeholder="Search attendee or student ID" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search roster" />
              </div>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="sm:w-40" aria-label="Filter by status">
                <option value="all">All statuses</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="excused">Excused</option>
                <option value={ended ? 'absent' : 'pending'}>{ended ? 'Absent' : 'Not yet'}</option>
              </Select>
              <Button variant="secondary" icon={<UserPlus className="size-4" />} onClick={() => setWalkIn(true)}>
                Add walk-in
              </Button>
            </div>

            {visible.length ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                      <th className="pb-2">Student</th>
                      <th className="pb-2">Student ID</th>
                      <th className="pb-2">Check-in</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2 text-right">Mark as</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visible.map((r) => (
                      <tr key={r.user.id}>
                        <td className="py-2.5">
                          <div className="flex items-center gap-3">
                            <Avatar initials={r.user.initials} name={r.user.name} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-800">{r.user.name}</p>
                              <p className="text-[11px] text-slate-400">
                                {r.user.program_label}
                                {r.registered ? ' · Registered' : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 font-mono text-xs text-slate-500">{r.user.id_number}</td>
                        <td className="py-2.5 text-xs text-slate-500">
                          {r.checked_in_at ? formatTime(r.checked_in_at) : '—'}
                          {r.method && <span className="block text-[10px] text-slate-400">{checkInMethod[r.method] ?? r.method}</span>}
                        </td>
                        <td className="py-2.5">
                          <Badge tone={attendanceStatus[r.status].tone}>{attendanceStatus[r.status].label}</Badge>
                        </td>
                        <td className="py-2.5 text-right">
                          <select
                            aria-label={`Change status for ${r.user.name}`}
                            className="rounded-lg border-0 bg-slate-50 py-1 pr-7 pl-2 text-xs text-slate-600 ring-1 ring-slate-200 ring-inset"
                            value=""
                            onChange={(e) => e.target.value && mark.mutate({ user_id: r.user.id, status: e.target.value })}
                          >
                            <option value="">Change…</option>
                            <option value="present">Present</option>
                            <option value="late">Late</option>
                            <option value="excused">Excused</option>
                            <option value="absent">Absent</option>
                            <option value="clear">Clear record</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={<Users />} title="No one matches" description={data.roster.length ? 'Try another search or filter.' : 'Registered students and required members will appear here.'} />
            )}

            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing {filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <div className="rounded-2xl bg-navy-900 p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Student QR check-in</p>
              {isOpen ? <Badge tone="green" dot>Live</Badge> : <Badge>Closed</Badge>}
            </div>
            <div className="mt-4">
              {isOpen && code.data?.open ? (
                <>
                  <QrPanel code={code.data} title={event.title} />
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button size="sm" variant="secondary" icon={<Maximize2 className="size-3.5" />} onClick={() => setFullscreen(true)}>
                      Display
                    </Button>
                    <Button size="sm" variant="danger" loading={close.isPending} onClick={() => close.mutate()}>
                      End check-in
                    </Button>
                  </div>
                </>
              ) : isOpen ? (
                <div className="grid h-60 place-items-center rounded-2xl bg-white/5 text-sm text-blue-100/70">Loading code…</div>
              ) : (
                <div className="rounded-2xl bg-white/5 p-6 text-center">
                  <QrCode className="mx-auto size-10 text-blue-200/60" />
                  <p className="mt-3 text-sm text-blue-100/80">{ended ? 'This event has ended.' : 'Open check-in to show a rotating QR code that students scan with their phones.'}</p>
                  {!ended && (
                    <Button className="mt-4" loading={open.isPending} onClick={() => open.mutate()} icon={<Play className="size-4" />}>
                      Open check-in
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          <Card>
            <CardHeader title="Live activity" subtitle="Most recent check-ins" />
            <CardBody className="space-y-3 pt-3">
              {data.recent.length ? (
                data.recent.map((r, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="grid size-7 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                      <UserCheck className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{r.name}</p>
                      <p className="text-[11px] text-slate-400">{checkInMethod[r.method ?? 'manual']} · {attendanceStatus[r.status].label}</p>
                    </div>
                    <span className="text-[11px] text-slate-400">{relativeTime(r.checked_in_at)}</span>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-sm text-slate-500">No check-ins yet.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        open={walkIn}
        onClose={() => setWalkIn(false)}
        title="Add a walk-in"
        description="For students without a phone or who couldn't scan."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setWalkIn(false)}>
              Cancel
            </Button>
            <Button loading={mark.isPending} disabled={!identifier.trim()} onClick={() => mark.mutate({ identifier: identifier.trim(), status: 'present' })}>
              Mark present
            </Button>
          </>
        }
      >
        <Field label="School ID number or email" hint="Ask to see their school ID.">
          {(fid) => <Input id={fid} value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="2025-00123" autoFocus />}
        </Field>
      </Modal>

      {fullscreen && code.data?.open && <QrPanel code={code.data} title={event.title} fullscreen onClose={() => setFullscreen(false)} />}
    </>
  )
}
