import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BarChart3, CalendarDays, Check, CheckCircle2, ClipboardCheck, Download, Plus, Settings2, UserPlus, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { downloadFile, getErrorMessage } from '@/api/client'
import { officerApi } from '@/api/officer'
import { ReviewModal } from '@/components/shared/ReviewModal'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/Feedback'
import { Avatar, PageHeader, ProgressBar } from '@/components/ui/Misc'
import { StatCard } from '@/components/ui/StatCard'
import { useAuth } from '@/context/AuthContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/cn'
import { formatDate, formatTimeRange, percent, plural } from '@/lib/format'
import { orgStatus } from '@/lib/status'
import type { Application } from '@/types'

export default function OfficerOverviewPage() {
  useDocumentTitle('Officer dashboard')
  const { activeOrganization } = useAuth()
  const queryClient = useQueryClient()
  const [review, setReview] = useState<{ app: Application; mode: 'approve' | 'reject' } | null>(null)
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['officer', 'overview', activeOrganization?.id], queryFn: officerApi.overview })

  const decide = useMutation({
    mutationFn: ({ app, mode, note }: { app: Application; mode: 'approve' | 'reject'; note: string }) =>
      mode === 'approve' ? officerApi.approveApplication(app.id, note) : officerApi.rejectApplication(app.id, note),
    onSuccess: (_, { app, mode }) => {
      toast.success(mode === 'approve' ? `${app.applicant?.name} is now a member.` : 'Application declined.')
      setReview(null)
      queryClient.invalidateQueries({ queryKey: ['officer'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  if (isLoading) return <PageLoader />
  if (error || !data) return <ErrorState error={error} onRetry={refetch} />

  const { stats, organization: org, next_event: next } = data
  const status = orgStatus[org.status]

  return (
    <>
      <PageHeader
        eyebrow={org.name}
        title="Officer dashboard"
        description="Manage membership, events and participation for your organization."
        actions={
          <>
            {org.status !== 'active' && <Badge tone={status.tone}>{status.label}</Badge>}
            <Button to="/officer/events/new" icon={<Plus className="size-4" />}>
              Create event
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Active members" value={stats.members} hint={`+${stats.new_members} since the start of the academic year`} icon={<Users />} to="/officer/members" />
        <StatCard
          label="Pending applications"
          value={stats.pending_applications}
          hint={stats.stale_applications ? `${plural(stats.stale_applications, 'application')} waiting 3+ days` : 'All recent'}
          icon={<UserPlus />}
          tone="amber"
          to="/officer/applications"
        />
        <StatCard label="Upcoming events" value={stats.upcoming_events} hint={next ? `Next: ${next.title}` : 'Nothing scheduled'} icon={<CalendarDays />} tone="violet" to="/officer/events" />
        <StatCard label="Average attendance" value={percent(stats.average_attendance)} hint={`Across ${plural(stats.completed_events, 'completed event')}`} icon={<BarChart3 />} tone="green" to="/officer/attendance" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              title="Membership approvals"
              subtitle={`${plural(stats.pending_applications, 'pending application')}`}
              action={<Link to="/officer/applications" className="text-xs font-medium text-blue-600">Review all applications</Link>}
            />
            <CardBody className="pt-3">
              {data.pending_applications.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                        <th className="pb-2 font-semibold">Applicant</th>
                        <th className="pb-2 font-semibold">Submitted</th>
                        <th className="pb-2 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.pending_applications.map((app) => (
                        <tr key={app.id}>
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <Avatar initials={app.applicant?.initials ?? '?'} name={app.applicant?.name} size="sm" />
                              <div className="min-w-0">
                                <p className="font-medium text-slate-800">{app.applicant?.name}</p>
                                <p className="text-xs text-slate-500">{app.applicant?.program_label}</p>
                                <p className="line-clamp-1 text-xs text-slate-400">{app.reason}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-xs whitespace-nowrap text-slate-500">{formatDate(app.submitted_at)}</td>
                          <td className="py-3">
                            <div className="flex justify-end gap-1.5">
                              <button onClick={() => setReview({ app, mode: 'approve' })} className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100" aria-label={`Approve ${app.applicant?.name}`}>
                                <Check className="size-4" />
                              </button>
                              <button onClick={() => setReview({ app, mode: 'reject' })} className="grid size-8 place-items-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100" aria-label={`Decline ${app.applicant?.name}`}>
                                <X className="size-4" />
                              </button>
                              <Button size="sm" variant="secondary" to="/officer/applications">
                                Review
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState icon={<CheckCircle2 />} title="No pending applications" description="You're all caught up." />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Member management"
              subtitle="Recently active members"
              action={
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" icon={<Download className="size-3.5" />} onClick={() => downloadFile('/officer/members/export', 'members.csv').catch((e) => toast.error(getErrorMessage(e)))}>
                    Export
                  </Button>
                  <Button size="sm" variant="secondary" to="/officer/members" icon={<Users className="size-3.5" />}>
                    Manage members
                  </Button>
                </div>
              }
            />
            <CardBody className="divide-y divide-slate-100 pt-2">
              {data.recent_members.map((m) => (
                <div key={m.membership_id} className="flex items-center gap-3 py-3">
                  <Avatar initials={m.user.initials} name={m.user.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{m.user.name}</p>
                    <p className="text-xs text-slate-500">{m.position}</p>
                  </div>
                  <span className={cn('w-12 text-right text-sm font-semibold', m.status === 'at_risk' ? 'text-amber-600' : 'text-slate-700')}>{percent(m.attendance_rate)}</span>
                  <Badge tone={m.status === 'at_risk' ? 'amber' : 'green'}>{m.status === 'at_risk' ? 'At risk' : 'Active'}</Badge>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Next event" subtitle={next ? formatDate(next.starts_at, { weekday: 'long', month: 'long', day: 'numeric' }) : undefined} />
            <CardBody>
              {next ? (
                <>
                  <Badge tone={next.check_in_open ? 'blue' : 'green'} dot={next.check_in_open}>
                    {next.check_in_open ? 'Check-in open' : 'Registration open'}
                  </Badge>
                  <p className="mt-2 text-base font-semibold text-slate-900">{next.title}</p>
                  <p className="text-xs text-slate-500">
                    {formatTimeRange(next.starts_at, next.ends_at)} · {next.venue}
                  </p>
                  <div className="mt-4 flex justify-between text-xs text-slate-500">
                    <span>Registered</span>
                    <span className="font-medium text-slate-700">
                      {next.registrations_count ?? 0}
                      {next.capacity ? ` / ${next.capacity}` : ''}
                    </span>
                  </div>
                  {next.capacity && <ProgressBar value={next.registrations_count ?? 0} max={next.capacity} className="mt-2" />}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" to={`/officer/events/${next.id}/edit`} icon={<Settings2 className="size-3.5" />}>
                      Manage event
                    </Button>
                    <Button size="sm" to={`/officer/events/${next.id}/attendance`} icon={<ClipboardCheck className="size-3.5" />}>
                      Attendance
                    </Button>
                  </div>
                </>
              ) : (
                <EmptyState icon={<CalendarDays />} title="No upcoming events" action={<Button size="sm" to="/officer/events/new">Create event</Button>} className="py-4" />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="This week" subtitle="Officer checklist" />
            <CardBody className="space-y-1 pt-3">
              {data.checklist.map((item) => (
                <Link key={item.label} to={item.link} className="flex items-start gap-3 rounded-lg p-2 hover:bg-slate-50">
                  <span className={cn('mt-0.5 grid size-4 shrink-0 place-items-center rounded border', item.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300')}>
                    {item.done && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  <span className={cn('text-sm', item.done ? 'text-slate-400 line-through' : 'text-slate-700')}>{item.label}</span>
                </Link>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>

      <ReviewModal
        open={!!review}
        onClose={() => setReview(null)}
        mode={review?.mode ?? 'approve'}
        title={review?.mode === 'approve' ? `Approve ${review?.app.applicant?.name}?` : `Decline ${review?.app.applicant?.name}?`}
        description={review?.app.applicant?.program_label ?? undefined}
        loading={decide.isPending}
        onConfirm={(note) => review && decide.mutate({ ...review, note })}
      />
    </>
  )
}
