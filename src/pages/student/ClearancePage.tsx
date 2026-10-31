import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Clock4, FileWarning, Hourglass, ShieldAlert, ShieldCheck, TrendingUp, XCircle } from 'lucide-react'
import { studentApi } from '@/api/student'
import { ExcuseModal } from '@/components/shared/ExcuseModal'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Alert, EmptyState, ErrorState, PageLoader } from '@/components/ui/Feedback'
import { OrgMark, PageHeader, ProgressBar } from '@/components/ui/Misc'
import { StatCard } from '@/components/ui/StatCard'
import { useAuth } from '@/context/AuthContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDate, percent } from '@/lib/format'
import { attendanceStatus, excuseStatus } from '@/lib/status'
import type { ClearanceItem, ClearanceMissed } from '@/types'

const statusMeta = {
  cleared: { label: 'Cleared', tone: 'green' as const, icon: CheckCircle2, color: 'text-emerald-600' },
  under_review: { label: 'Excuse under review', tone: 'amber' as const, icon: Hourglass, color: 'text-amber-600' },
  action_needed: { label: 'Action needed', tone: 'red' as const, icon: XCircle, color: 'text-red-600' },
}

function ClearanceRow({ item, onExcuse }: { item: ClearanceItem; onExcuse: (missed: ClearanceMissed) => void }) {
  const meta = statusMeta[item.status]

  return (
    <div className="py-4">
      <div className="flex items-start gap-3">
        <OrgMark acronym={item.organization.acronym} color={item.organization.color} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link to={`/organizations/${item.organization.slug}`} className="text-sm font-semibold text-slate-900 hover:text-blue-600">
              {item.organization.name}
            </Link>
            <Badge tone={meta.tone}>
              <meta.icon className="size-3" /> {meta.label}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {item.position} · {item.required ? `${item.attended + item.excused} of ${item.required} required events complete` : 'No required events yet'}
          </p>

          {item.missed.length > 0 && (
            <ul className="mt-3 space-y-2">
              {item.missed.map((m) => (
                <li key={m.event_id} className="flex flex-col gap-2 rounded-xl bg-slate-50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{m.title}</p>
                    <p className="text-xs text-slate-500">
                      Missed · {formatDate(m.starts_at)} · {m.venue}
                    </p>
                  </div>
                  {m.excuse_status ? (
                    <Badge tone={excuseStatus[m.excuse_status].tone}>{excuseStatus[m.excuse_status].label}</Badge>
                  ) : m.can_file_excuse ? (
                    <Button size="sm" variant="secondary" icon={<FileWarning className="size-3.5" />} onClick={() => onExcuse(m)}>
                      File excuse
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-500">Excuse window closed — talk to the officers</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ClearancePage() {
  useDocumentTitle('Attendance & clearance')
  const { campus } = useAuth()
  const [excuseFor, setExcuseFor] = useState<{ id: number; title: string; starts_at: string } | null>(null)
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['student', 'clearance'], queryFn: studentApi.clearance })

  if (isLoading) return <PageLoader />
  if (error || !data) return <ErrorState error={error} onRetry={refetch} />

  const { summary, clearance, history } = data
  const cleared = clearance.overall === 'cleared'

  return (
    <>
      <PageHeader
        eyebrow="Attendance & clearance"
        title="Am I cleared?"
        description="Every organization checks attendance at required events before signing your semester clearance. Fix problems here — not during clearance week."
      />

      <Alert
        tone={cleared ? 'success' : 'warning'}
        icon={cleared ? <ShieldCheck /> : <ShieldAlert />}
        title={cleared ? `You're cleared in all ${clearance.total} organizations` : `${clearance.cleared} of ${clearance.total} organizations cleared`}
        className="mb-6"
      >
        {cleared
          ? 'Nothing to settle. Bring your school ID during clearance signing.'
          : `File an excuse within ${campus?.excuse_window_days ?? 7} days of a missed required event, or talk to the officers to settle older absences.`}
      </Alert>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Attendance rate" value={percent(summary.rate)} hint={`${summary.attended} attended`} icon={<TrendingUp />} tone="green" />
        <StatCard label="Missed" value={summary.missed} hint="Without an approved excuse" icon={<XCircle />} tone="red" />
        <StatCard label="Excused" value={summary.excused} hint="Approved by officers" icon={<FileWarning />} tone="violet" />
        <StatCard label="Service hours" value={summary.service_hours} hint={`Goal: ${summary.service_hours_goal}`} icon={<Clock4 />} tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Clearance by organization" subtitle="Based on required (mandatory) events since you joined" />
          <CardBody className="divide-y divide-slate-100 pt-1">
            {clearance.items.length ? (
              clearance.items.map((item) => (
                <ClearanceRow key={item.organization.id} item={item} onExcuse={(m) => setExcuseFor({ id: m.event_id, title: m.title, starts_at: m.starts_at })} />
              ))
            ) : (
              <EmptyState title="No memberships yet" />
            )}
          </CardBody>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Service hours" subtitle={campus?.semester} />
            <CardBody>
              <p className="text-sm text-slate-700">
                <span className="text-2xl font-semibold text-slate-900">{summary.service_hours}</span> / {summary.service_hours_goal} hours
              </p>
              <ProgressBar value={summary.service_hours} max={summary.service_hours_goal} tone="amber" className="mt-3" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Attendance history" subtitle={`${history.length} events this semester`} />
            <CardBody className="max-h-[480px] divide-y divide-slate-100 overflow-y-auto pt-1">
              {history.length ? (
                history.map((row) => (
                  <Link key={row.id} to={`/events/${row.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50/60">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{row.title}</p>
                      <p className="text-xs text-slate-500">
                        {row.organization.acronym} · {formatDate(row.starts_at, { month: 'short', day: 'numeric' })}
                        {row.is_mandatory && ' · Required'}
                      </p>
                    </div>
                    <Badge tone={attendanceStatus[row.status].tone}>{attendanceStatus[row.status].label}</Badge>
                  </Link>
                ))
              ) : (
                <EmptyState title="No events yet" description="Your attendance will show up here after your first event." />
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <ExcuseModal open={!!excuseFor} onClose={() => setExcuseFor(null)} event={excuseFor} />
    </>
  )
}
