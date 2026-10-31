import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, ClipboardCheck } from 'lucide-react'
import { officerApi } from '@/api/officer'
import { Badge } from '@/components/ui/Badge'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/Feedback'
import { DateTile, PageHeader, ProgressBar } from '@/components/ui/Misc'
import { useAuth } from '@/context/AuthContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatTimeRange, percent } from '@/lib/format'
import type { CampusEvent } from '@/types'

function Row({ event, past }: { event: CampusEvent; past?: boolean }) {
  const rate = event.stats?.rate ?? null

  return (
    <Link to={`/officer/events/${event.id}/attendance`} className="flex items-center gap-4 rounded-xl p-3 transition hover:bg-slate-50">
      <DateTile iso={event.starts_at} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-slate-900">{event.title}</p>
          {event.is_mandatory && <Badge tone="red">Required</Badge>}
          {event.check_in_open && <Badge tone="blue" dot>Check-in live</Badge>}
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          {formatTimeRange(event.starts_at, event.ends_at)} · {event.venue}
        </p>
        {past && event.stats && (
          <div className="mt-2 flex items-center gap-3">
            <ProgressBar value={rate ?? 0} tone={rate !== null && rate < 75 ? 'amber' : 'green'} className="max-w-48" />
            <span className="text-xs text-slate-500">
              {event.stats.attended}/{event.stats.expected - event.stats.excused} attended
            </span>
          </div>
        )}
      </div>
      {past ? <span className="text-sm font-semibold text-slate-800">{percent(rate)}</span> : <span className="text-xs text-slate-500">{event.registrations_count ?? 0} registered</span>}
      <ChevronRight className="size-4 text-slate-300" />
    </Link>
  )
}

export default function AttendanceListPage() {
  useDocumentTitle('Attendance')
  const { activeOrganization } = useAuth()
  const upcoming = useQuery({ queryKey: ['officer', 'events', activeOrganization?.id, 'upcoming'], queryFn: () => officerApi.events('upcoming') })
  const past = useQuery({ queryKey: ['officer', 'events', activeOrganization?.id, 'past'], queryFn: () => officerApi.events('past') })

  if (upcoming.isLoading || past.isLoading) return <PageLoader />
  if (upcoming.error || past.error) return <ErrorState error={upcoming.error ?? past.error} onRetry={() => { upcoming.refetch(); past.refetch() }} />

  return (
    <>
      <PageHeader eyebrow={activeOrganization?.name} title="Attendance" description="Open QR check-in on event day, add walk-ins and fix records. Every result is saved instantly — no paper sign-in sheets." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Upcoming & today" subtitle="Open check-in when students start arriving" />
          <CardBody className="pt-2">
            {upcoming.data?.data.length ? upcoming.data.data.map((e) => <Row key={e.id} event={e} />) : <EmptyState icon={<ClipboardCheck />} title="No upcoming events" />}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Completed events" subtitle="Attendance results" />
          <CardBody className="pt-2">
            {past.data?.data.length ? past.data.data.map((e) => <Row key={e.id} event={e} past />) : <EmptyState icon={<ClipboardCheck />} title="No completed events yet" />}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
