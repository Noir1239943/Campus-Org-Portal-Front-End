import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ArrowRight, BarChart3, CalendarCheck2, CalendarDays, Download, Info, ShieldAlert, Users } from 'lucide-react'
import { toast } from 'sonner'
import { adviserApi } from '@/api/adviser'
import { downloadFile, getErrorMessage } from '@/api/client'
import { MonthlyBarChart } from '@/components/shared/MonthlyBarChart'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ErrorState, PageLoader } from '@/components/ui/Feedback'
import { OrgMark, PageHeader, ProgressBar } from '@/components/ui/Misc'
import { StatCard } from '@/components/ui/StatCard'
import { useAuth } from '@/context/AuthContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/cn'
import { percent, plural } from '@/lib/format'
import { healthStatus } from '@/lib/status'

const alertStyles = {
  danger: { icon: ShieldAlert, className: 'bg-red-50 text-red-600' },
  warning: { icon: AlertTriangle, className: 'bg-amber-50 text-amber-600' },
  info: { icon: Info, className: 'bg-blue-50 text-blue-600' },
}

const bucketDot = { success: 'bg-emerald-500', primary: 'bg-blue-600', warning: 'bg-amber-500' }

export default function OversightPage() {
  useDocumentTitle('Oversight')
  const { campus } = useAuth()
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['adviser', 'overview'], queryFn: adviserApi.overview })

  if (isLoading) return <PageLoader />
  if (error || !data) return <ErrorState error={error} onRetry={refetch} />

  const { stats, attendance } = data

  return (
    <>
      <PageHeader
        eyebrow="Student affairs oversight"
        title="Organization health overview"
        description="Recognized organizations, event activity, student engagement and attendance risks across campus."
        actions={
          <>
            <Button variant="secondary" icon={<Download className="size-4" />} onClick={() => downloadFile('/adviser/reports/organizations', 'organizations.csv').catch((e) => toast.error(getErrorMessage(e)))}>
              Export report
            </Button>
            <Button to="/adviser/events" icon={<CalendarCheck2 className="size-4" />}>
              Review approvals{stats.pending_event_approvals ? ` (${stats.pending_event_approvals})` : ''}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Active organizations" value={stats.organizations} hint={`${stats.organizations_good_standing} in good standing · ${stats.organizations_under_review} under review`} icon={<Users />} to="/adviser/organizations" />
        <StatCard label="Student memberships" value={stats.memberships.toLocaleString()} hint={`${stats.students_involved} students involved`} icon={<Users />} tone="violet" to="/adviser/students" />
        <StatCard label="Events this term" value={stats.events_this_term} hint={`${stats.events_next_30_days} scheduled in the next 30 days`} icon={<CalendarDays />} tone="green" to="/adviser/events?tab=upcoming" />
        <StatCard label="Attendance risks" value={stats.attendance_risks} hint={`Organizations below the ${campus?.attendance_threshold ?? 75}% threshold`} icon={<AlertTriangle />} tone="amber" to="/adviser/attendance" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Organization activity" subtitle={`Published events per month · ${campus?.semester} ${campus?.academic_year}`} />
          <CardBody>
            <MonthlyBarChart data={data.activity} label="Published events per month" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Attendance performance" subtitle={`${plural(attendance.completed_events, 'completed event')}`} />
          <CardBody>
            <p className="text-3xl font-semibold tracking-tight text-slate-900">{percent(attendance.average)}</p>
            <ProgressBar value={attendance.average ?? 0} className="mt-3" />
            <p className="mt-4 text-xs font-medium text-slate-500">Organizations by average attendance</p>
            <ul className="mt-2 space-y-2">
              {attendance.buckets.map((b) => (
                <li key={b.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className={cn('size-2 rounded-full', bucketDot[b.tone])} aria-hidden />
                    {b.label}
                  </span>
                  <span className="font-medium text-slate-800">{plural(b.count, 'organization')}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Organization performance"
            subtitle="Ranked by membership"
            action={
              <Link to="/adviser/organizations" className="text-xs font-medium text-blue-600">
                View all
              </Link>
            }
          />
          <CardBody className="pt-3">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                    <th className="pb-2">Organization</th>
                    <th className="pb-2 text-right">Members</th>
                    <th className="pb-2 text-right">Events</th>
                    <th className="pb-2 text-right">Attendance</th>
                    <th className="pb-2 pl-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.organizations.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5">
                        <Link to={`/adviser/organizations/${org.id}`} className="flex items-center gap-3">
                          <OrgMark acronym={org.acronym} color={org.color} size="sm" />
                          <span className="font-medium text-slate-800 hover:text-blue-600">{org.name}</span>
                        </Link>
                      </td>
                      <td className="py-2.5 text-right text-slate-600">{org.members_count}</td>
                      <td className="py-2.5 text-right text-slate-600">{org.events_count}</td>
                      <td className={cn('py-2.5 text-right font-semibold', org.health === 'at_risk' ? 'text-red-600' : 'text-slate-800')}>{percent(org.attendance_rate)}</td>
                      <td className="py-2.5 pl-4">
                        <Badge tone={healthStatus[org.health].tone}>{healthStatus[org.health].label}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Priority alerts" subtitle={plural(data.alerts.length, 'item') + ' need attention'} />
            <CardBody className="space-y-3 pt-3">
              {data.alerts.length ? (
                data.alerts.map((alert, i) => {
                  const style = alertStyles[alert.level]
                  return (
                    <Link key={i} to={alert.link} className="flex gap-3 rounded-xl p-2 hover:bg-slate-50">
                      <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg', style.className)}>
                        <style.icon className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-slate-800">{alert.title}</span>
                        <span className="block text-xs text-slate-500">{alert.message}</span>
                      </span>
                    </Link>
                  )
                })
              ) : (
                <p className="py-4 text-center text-sm text-slate-500">No alerts. Everything looks healthy.</p>
              )}
            </CardBody>
          </Card>

          <Card className="border-blue-100 bg-blue-50/50">
            <CardBody>
              <div className="flex items-start justify-between">
                <p className="text-sm font-semibold text-slate-900">Event approvals</p>
                <BarChart3 className="size-4 text-blue-600" />
              </div>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.pending_event_approvals}</p>
              <p className="mt-1 text-xs text-slate-600">Activity proposals waiting for your review. Approved events become visible to students right away.</p>
              <Button to="/adviser/events" className="mt-4 w-full" icon={<ArrowRight className="size-4" />}>
                Open review queue
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}
