import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, CalendarX2, Search } from 'lucide-react'
import { studentApi } from '@/api/student'
import { EventListItem } from '@/components/shared/EventListItem'
import { ExcuseModal } from '@/components/shared/ExcuseModal'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { EmptyState, ErrorState } from '@/components/ui/Feedback'
import { Input, Select } from '@/components/ui/Field'
import { PageHeader, Tabs } from '@/components/ui/Misc'
import { useDebounce } from '@/hooks/useDebounce'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { attendanceStatus, eventTypes, excuseStatus } from '@/lib/status'
import type { CampusEvent } from '@/types'

type Tab = 'mine' | 'browse' | 'past'

/** Groups events under month headings ("November 2026"). */
function groupByMonth(events: CampusEvent[]) {
  const groups = new Map<string, CampusEvent[]>()
  for (const event of events) {
    const key = new Date(event.starts_at).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
    groups.set(key, [...(groups.get(key) ?? []), event])
  }
  return [...groups.entries()]
}

export default function EventsPage() {
  useDocumentTitle('My events')
  const [params, setParams] = useSearchParams()
  const tab = (['mine', 'browse', 'past'].includes(params.get('tab') ?? '') ? params.get('tab') : 'mine') as Tab
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [excuseFor, setExcuseFor] = useState<CampusEvent | null>(null)
  const debounced = useDebounce(search)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['student', 'events', tab, debounced, type],
    queryFn: () => studentApi.events(tab, tab === 'browse' ? { search: debounced, type } : {}),
  })

  const right = (event: CampusEvent) => {
    const v = event.viewer
    if (tab === 'past') {
      if (v?.attendance_status) return <Badge tone={attendanceStatus[v.attendance_status].tone}>{attendanceStatus[v.attendance_status].label}</Badge>
      if (v?.excuse_status) return <Badge tone={excuseStatus[v.excuse_status].tone}>{excuseStatus[v.excuse_status].label}</Badge>
      if (v?.can_file_excuse)
        return (
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.preventDefault()
              setExcuseFor(event)
            }}
          >
            File excuse
          </Button>
        )
      return <Badge tone="red">Absent</Badge>
    }
    return undefined
  }

  return (
    <>
      <PageHeader eyebrow="Events" title="My events" description="Your schedule, events open to everyone, and your attendance history." />

      <Tabs
        value={tab}
        onChange={(value) => setParams({ tab: value }, { replace: true })}
        items={[
          { value: 'mine', label: 'My schedule' },
          { value: 'browse', label: 'Browse all events' },
          { value: 'past', label: 'Past & attendance' },
        ]}
      />

      {tab === 'browse' && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input type="search" className="pl-9" placeholder="Search by title or venue" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search events" />
          </div>
          <Select value={type} onChange={(e) => setType(e.target.value)} className="sm:w-44" aria-label="Event type">
            <option value="">All types</option>
            {eventTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        </div>
      )}

      <div className="mt-4">
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isLoading ? (
          <div className="h-80 animate-pulse rounded-2xl bg-white" />
        ) : data?.length ? (
          <div className="space-y-6">
            {groupByMonth(data).map(([month, events]) => (
              <section key={month}>
                <h2 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">{month}</h2>
                <Card>
                  <CardBody className="divide-y divide-slate-100 py-2">
                    {events.map((event) => (
                      <EventListItem key={event.id} event={event} to={`/events/${event.id}`} right={right(event)} />
                    ))}
                  </CardBody>
                </Card>
              </section>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={tab === 'past' ? <CalendarX2 /> : <CalendarDays />}
              title={tab === 'past' ? 'No past events yet' : tab === 'browse' ? 'No events found' : 'Your schedule is empty'}
              description={tab === 'mine' ? 'Register for events open to all students, or join an organization.' : undefined}
              action={tab === 'mine' ? <Button onClick={() => setParams({ tab: 'browse' })}>Browse events</Button> : undefined}
            />
          </Card>
        )}
      </div>

      <ExcuseModal open={!!excuseFor} onClose={() => setExcuseFor(null)} event={excuseFor} />
    </>
  )
}
