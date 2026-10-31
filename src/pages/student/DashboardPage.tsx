import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CalendarDays, Clock4, Compass, FileClock, QrCode, ShieldAlert, ShieldCheck, TrendingUp, Users } from 'lucide-react'
import { studentApi } from '@/api/student'
import { AnnouncementCard } from '@/components/shared/AnnouncementCard'
import { EventListItem } from '@/components/shared/EventListItem'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/Feedback'
import { OrgMark, PageHeader, ProgressBar } from '@/components/ui/Misc'
import { StatCard } from '@/components/ui/StatCard'
import { useAuth } from '@/context/AuthContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { firstName, formatDate, greeting, percent, plural } from '@/lib/format'

export default function DashboardPage() {
  useDocumentTitle('Dashboard')
  const { user, campus } = useAuth()
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['student', 'dashboard'], queryFn: studentApi.dashboard })

  if (isLoading) return <PageLoader />
  if (error || !data) return <ErrorState error={error} onRetry={refetch} />

  const { stats, clearance } = data
  const attendance = stats.attendance
  const rateTone = attendance.rate === null ? 'blue' : attendance.rate >= 85 ? 'green' : attendance.rate >= 75 ? 'blue' : 'amber'

  return (
    <>
      <PageHeader
        eyebrow="Student workspace"
        title={`${greeting()}, ${firstName(user?.first_name ?? '')}`}
        description={`Your organizations, events and participation for the ${campus?.semester ?? ''} of A.Y. ${campus?.academic_year ?? ''}.`}
        actions={
          <Button to="/discover" icon={<Compass className="size-4" />}>
            Discover organizations
          </Button>
        }
      />

      {/* Check-in is open right now */}
      {data.check_in_now.map((event) => (
        <Link
          key={event.id}
          to={`/check-in?event=${event.id}`}
          className="mb-4 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white shadow-md transition hover:shadow-lg sm:p-5"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/15">
            <QrCode className="size-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-medium text-blue-100">Check-in is open now</span>
            <span className="block truncate font-semibold">{event.title}</span>
            <span className="block truncate text-xs text-blue-100">{event.venue}</span>
          </span>
          <span className="hidden items-center gap-1 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-blue-700 sm:flex">
            Check in <ArrowRight className="size-4" />
          </span>
        </Link>
      ))}

      {clearance.action_needed > 0 && (
        <Link
          to="/clearance"
          className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 transition hover:bg-amber-100/60"
        >
          <ShieldAlert className="size-5 shrink-0" />
          <span className="flex-1 text-sm">
            <span className="font-semibold">Clearance needs your attention.</span>{' '}
            You missed a required event in {plural(clearance.action_needed, 'organization')}. File an excuse or settle it before clearance week.
          </span>
          <ArrowRight className="size-4 shrink-0" />
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Joined organizations" value={stats.organizations} hint="Including the student government" icon={<Users />} to="/my-organizations" />
        <StatCard
          label="Upcoming events"
          value={stats.upcoming_events}
          hint={`${plural(stats.upcoming_this_week, 'event')} in the next 7 days`}
          icon={<CalendarDays />}
          tone="violet"
          to="/events"
        />
        <StatCard
          label="Attendance rate"
          value={percent(attendance.rate)}
          hint={`${attendance.attended} of ${attendance.total - attendance.excused} expected events attended`}
          icon={<TrendingUp />}
          tone="green"
          to="/clearance"
        />
        <StatCard
          label="Service hours"
          value={attendance.service_hours}
          hint={`Goal: ${attendance.service_hours_goal} hours this semester`}
          icon={<Clock4 />}
          tone="amber"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              title="Upcoming events"
              subtitle="Events you registered for and events from your organizations"
              action={
                <Link to="/events" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                  View all
                </Link>
              }
            />
            <CardBody className="divide-y divide-slate-100 pt-2">
              {data.upcoming_events.length ? (
                data.upcoming_events.map((event, i) => <EventListItem key={event.id} event={event} to={`/events/${event.id}`} highlight={i === 0} />)
              ) : (
                <EmptyState icon={<CalendarDays />} title="No upcoming events" description="Browse events open to all students." action={<Button variant="secondary" to="/events?tab=browse">Browse events</Button>} />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="My organizations"
              subtitle={plural(data.organizations.length, 'active membership')}
              action={
                <Link to="/my-organizations" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                  Manage memberships
                </Link>
              }
            />
            <CardBody className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {data.organizations.map((org) => (
                <Link key={org.id} to={`/organizations/${org.slug}`} className="rounded-xl border border-slate-200/80 p-4 transition hover:border-blue-200 hover:bg-slate-50">
                  <OrgMark acronym={org.acronym} color={org.color} size="sm" />
                  <p className="mt-3 line-clamp-2 text-sm font-semibold text-slate-900">{org.name}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <Badge tone={org.is_officer ? 'violet' : 'blue'}>{org.position}</Badge>
                    <span className="text-[11px] text-slate-400">{org.members_count} members</span>
                  </div>
                </Link>
              ))}
            </CardBody>
          </Card>

          {data.announcements.length > 0 && (
            <Card>
              <CardHeader
                title="Latest announcements"
                action={
                  <Link to="/announcements" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                    See all
                  </Link>
                }
              />
              <CardBody className="space-y-5">
                {data.announcements.map((a) => (
                  <AnnouncementCard key={a.id} announcement={a} compact />
                ))}
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Attendance" subtitle={campus?.semester} />
            <CardBody>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-semibold tracking-tight text-slate-900">{percent(attendance.rate)}</p>
                {attendance.rate !== null && (
                  <Badge tone={attendance.rate >= 75 ? 'green' : 'amber'}>{attendance.rate >= 85 ? 'Excellent standing' : attendance.rate >= 75 ? 'Good standing' : 'Needs attention'}</Badge>
                )}
              </div>
              <ProgressBar value={attendance.rate ?? 0} tone={rateTone} className="mt-3" />
              <div className="mt-3 flex justify-between text-xs text-slate-500">
                <span>Attended {attendance.attended}</span>
                <span>Excused {attendance.excused}</span>
                <span>Missed {attendance.missed}</span>
              </div>
            </CardBody>
          </Card>

          <Link to="/clearance" className="block">
            <Card className={clearance.overall === 'cleared' ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/40'}>
              <CardBody className="flex items-start gap-3">
                {clearance.overall === 'cleared' ? <ShieldCheck className="size-6 shrink-0 text-emerald-600" /> : <ShieldAlert className="size-6 shrink-0 text-amber-600" />}
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Clearance: {clearance.cleared} of {clearance.total} organizations cleared
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {clearance.overall === 'cleared' ? "You're all set for clearance signing." : 'See which required events you missed and what to do.'}
                  </p>
                </div>
              </CardBody>
            </Card>
          </Link>

          {data.pending_application && (
            <Card className="border-blue-100 bg-blue-50/50">
              <CardBody>
                <span className="grid size-9 place-items-center rounded-lg bg-white text-blue-600 shadow-sm">
                  <FileClock className="size-4" />
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-900">Application under review</p>
                <p className="mt-1 text-xs text-slate-600">
                  Your {data.pending_application.organization?.name} application was submitted {formatDate(data.pending_application.submitted_at, { month: 'long', day: 'numeric' })}.
                  Officers usually reply within 5 school days.
                </p>
                <Link to={`/applications/${data.pending_application.id}`} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600">
                  View application <ArrowRight className="size-3.5" />
                </Link>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Semester goal" subtitle="Community service hours" />
            <CardBody>
              <p className="text-sm text-slate-700">
                <span className="font-semibold">{attendance.service_hours}</span> of {attendance.service_hours_goal} service hours
              </p>
              <ProgressBar value={attendance.service_hours} max={attendance.service_hours_goal} tone="amber" className="mt-3" />
              <p className="mt-3 text-xs text-slate-500">
                {attendance.service_hours >= attendance.service_hours_goal
                  ? 'Goal reached — great work!'
                  : 'Join outreach activities (like mangrove planting) to earn more hours.'}
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}
