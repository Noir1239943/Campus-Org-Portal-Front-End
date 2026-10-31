import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, CalendarPlus, CheckCircle2, ChevronRight, Clock, Clock4, FileWarning, Lock, MapPin, Mic, QrCode, Users, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api/client'
import { studentApi } from '@/api/student'
import { ExcuseModal } from '@/components/shared/ExcuseModal'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Alert, ErrorState, PageLoader } from '@/components/ui/Feedback'
import { DateTile, Detail, OrgMark, ProgressBar } from '@/components/ui/Misc'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { downloadIcs } from '@/lib/calendar'
import { daysUntil, formatDateTime, formatLongDate, formatTimeRange } from '@/lib/format'
import { attendanceStatus, eventStatus, excuseStatus } from '@/lib/status'

export default function EventDetailPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const [excuseOpen, setExcuseOpen] = useState(false)
  const { data: event, isLoading, error, refetch } = useQuery({ queryKey: ['student', 'event', id], queryFn: () => studentApi.event(id) })
  useDocumentTitle(event?.title ?? 'Event')

  const onDone = (message: string) => {
    toast.success(message)
    queryClient.invalidateQueries({ queryKey: ['student'] })
  }

  const register = useMutation({
    mutationFn: () => studentApi.register(Number(id)),
    onSuccess: (res) => onDone(res.message),
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const cancel = useMutation({
    mutationFn: () => studentApi.cancelRegistration(Number(id)),
    onSuccess: (res) => onDone(res.message),
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  if (isLoading) return <PageLoader />
  if (error || !event) return <ErrorState error={error} onRetry={refetch} />

  const v = event.viewer
  const org = event.organization
  const registered = event.registrations_count ?? 0
  const status = eventStatus[event.display_status]

  return (
    <>
      <nav className="mb-4 flex items-center gap-1 text-xs text-slate-500" aria-label="Breadcrumb">
        <Link to="/events" className="hover:text-blue-600">My events</Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-slate-700">{event.title}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardBody className="sm:p-6">
              <div className="flex items-start gap-4">
                <DateTile iso={event.starts_at} highlight />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone="blue">{event.type}</Badge>
                    {event.is_mandatory && <Badge tone="red">Required for members</Badge>}
                    {event.visibility === 'members' && <Badge><Lock className="size-3" /> Members only</Badge>}
                    {event.display_status !== 'upcoming' && <Badge tone={status.tone}>{status.label}</Badge>}
                    {event.service_hours > 0 && <Badge tone="amber">{event.service_hours} service hours</Badge>}
                  </div>
                  <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{event.title}</h1>
                  {org && (
                    <Link to={`/organizations/${org.slug}`} className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600">
                      <OrgMark acronym={org.acronym} color={org.color} size="sm" /> {org.name}
                    </Link>
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Detail icon={<CalendarDays />} label="Date">{formatLongDate(event.starts_at)}</Detail>
                <Detail icon={<Clock />} label="Time">{formatTimeRange(event.starts_at, event.ends_at)}</Detail>
                <Detail icon={<MapPin />} label="Venue">{event.venue}</Detail>
                {event.speaker && <Detail icon={<Mic />} label="Speaker">{event.speaker}</Detail>}
              </div>
            </CardBody>
          </Card>

          {event.description && (
            <Card>
              <CardHeader title="About this event" />
              <CardBody>
                <p className="text-sm leading-relaxed whitespace-pre-line text-slate-600">{event.description}</p>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {event.status === 'cancelled' && (
            <Alert tone="danger" icon={<XCircle />} title="This event was cancelled">
              The organizers cancelled this event. It won't count against your attendance.
            </Alert>
          )}

          {/* Attendance result */}
          {v?.attendance_status && (
            <Alert tone={v.attendance_status === 'absent' ? 'danger' : 'success'} icon={<CheckCircle2 />} title={`Attendance: ${attendanceStatus[v.attendance_status].label}`}>
              {v.checked_in_at ? `Checked in ${formatDateTime(v.checked_in_at)}` : 'Recorded by the officers.'}
            </Alert>
          )}

          {v?.excuse_status && (
            <Alert tone={v.excuse_status === 'approved' ? 'success' : v.excuse_status === 'rejected' ? 'danger' : 'warning'} icon={<FileWarning />} title={excuseStatus[v.excuse_status].label}>
              {v.excuse_note || (v.excuse_status === 'pending' ? 'The officers will review it soon.' : null)}
            </Alert>
          )}

          <Card>
            <CardBody className="space-y-4">
              {event.display_status !== 'completed' && event.status === 'published' && (
                <p className="text-sm font-semibold text-slate-900">{daysUntil(event.starts_at)}</p>
              )}

              {event.capacity ? (
                <div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> Registered</span>
                    <span className="font-medium text-slate-700">{registered} / {event.capacity}</span>
                  </div>
                  <ProgressBar value={registered} max={event.capacity} className="mt-2" />
                  {v?.is_full && !v.registered && <p className="mt-2 text-xs text-red-600">This event is full.</p>}
                </div>
              ) : (
                <p className="inline-flex items-center gap-1 text-xs text-slate-500"><Users className="size-3.5" /> {registered} registered · no limit</p>
              )}

              {v?.mandatory_for_me && !v.attendance_status && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  This event is <strong>required</strong> for {org?.acronym} members. No registration needed — just check in at the venue.
                </p>
              )}

              <div className="flex flex-col gap-2">
                {v?.can_check_in && (
                  <Button to={`/check-in?event=${event.id}`} size="lg" icon={<QrCode className="size-4" />}>
                    Check in now
                  </Button>
                )}
                {v?.can_register && !v.mandatory_for_me && (
                  <Button size="lg" loading={register.isPending} onClick={() => register.mutate()}>
                    Register for this event
                  </Button>
                )}
                {v?.registered && !v.attendance_status && (
                  <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="size-4" /> You're registered
                  </p>
                )}
                {v?.can_cancel && (
                  <Button variant="ghost" loading={cancel.isPending} onClick={() => window.confirm('Cancel your registration?') && cancel.mutate()}>
                    Cancel registration
                  </Button>
                )}
                {v?.can_file_excuse && (
                  <Button variant="secondary" icon={<FileWarning className="size-4" />} onClick={() => setExcuseOpen(true)}>
                    {event.display_status === 'completed' ? 'File an excuse for missing this' : "Can't attend? File an excuse"}
                  </Button>
                )}
                {event.status === 'published' && event.display_status !== 'completed' && (
                  <Button variant="secondary" icon={<CalendarPlus className="size-4" />} onClick={() => downloadIcs(event)}>
                    Add to calendar
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>

          {event.service_hours > 0 && (
            <Card>
              <CardBody className="flex gap-3">
                <Clock4 className="size-5 shrink-0 text-amber-500" />
                <p className="text-xs text-slate-600">
                  Attending earns <strong>{event.service_hours} community service hours</strong>, added automatically when you check in.
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <ExcuseModal open={excuseOpen} onClose={() => setExcuseOpen(false)} event={event} />
    </>
  )
}
