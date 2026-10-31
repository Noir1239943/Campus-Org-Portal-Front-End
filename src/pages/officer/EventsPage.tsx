import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ban, CalendarDays, ClipboardCheck, Clock, Lock, MapPin, Mic, Pencil, Plus, Send, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api/client'
import { officerApi, type EventTab } from '@/api/officer'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Alert, EmptyState, ErrorState } from '@/components/ui/Feedback'
import { DateTile, Detail, PageHeader, ProgressBar, Tabs } from '@/components/ui/Misc'
import { useAuth } from '@/context/AuthContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/cn'
import { formatLongDate, formatTimeRange, percent } from '@/lib/format'
import { eventStatus } from '@/lib/status'
import type { CampusEvent } from '@/types'

function EventPanel({ event, onChanged }: { event: CampusEvent; onChanged: () => void }) {
  const { campus } = useAuth()
  const status = eventStatus[event.display_status]
  const registered = event.registrations_count ?? 0

  const submit = useMutation({
    mutationFn: () => officerApi.submitEvent(event.id),
    onSuccess: (e) => {
      toast.success(e.status === 'published' ? 'Event published.' : 'Sent to the OSA for approval.')
      onChanged()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const cancel = useMutation({
    mutationFn: () => officerApi.cancelEvent(event.id),
    onSuccess: () => {
      toast.success('Event cancelled. Registered students were notified.')
      onChanged()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const remove = useMutation({
    mutationFn: () => officerApi.deleteEvent(event.id),
    onSuccess: () => {
      toast.success('Draft deleted.')
      onChanged()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const isDraft = event.status === 'draft' || event.status === 'rejected'
  const canEdit = isDraft || event.status === 'pending' || event.display_status === 'upcoming'

  return (
    <Card className="lg:sticky lg:top-24">
      <CardBody className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <Badge tone={status.tone}>{status.label}</Badge>
          {canEdit && (
            <Button size="icon" variant="ghost" to={`/officer/events/${event.id}/edit`} aria-label="Edit event">
              <Pencil className="size-4" />
            </Button>
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{event.title}</h2>
          {event.description && <p className="mt-1 line-clamp-4 text-sm text-slate-500">{event.description}</p>}
        </div>

        {event.status === 'rejected' && event.review_note && (
          <Alert tone="danger" title="Returned by the OSA">
            {event.review_note}
          </Alert>
        )}
        {event.status === 'pending' && <Alert tone="warning">Waiting for OSA approval. Students can't see it yet.</Alert>}

        <div className="space-y-3">
          <Detail icon={<CalendarDays />} label="Date">{formatLongDate(event.starts_at)}</Detail>
          <Detail icon={<Clock />} label="Time">{formatTimeRange(event.starts_at, event.ends_at)}</Detail>
          <Detail icon={<MapPin />} label="Venue">{event.venue}</Detail>
          {event.speaker && <Detail icon={<Mic />} label="Speaker">{event.speaker}</Detail>}
          <Detail icon={event.visibility === 'members' ? <Lock /> : <Users />} label="Who can join">
            {event.visibility === 'members' ? 'Members only' : 'All students'}
            {event.is_mandatory && ' · Required for members'}
          </Detail>
        </div>

        {event.status === 'published' && (
          <div className="rounded-xl bg-slate-50 p-4">
            {event.display_status === 'completed' && event.stats ? (
              <>
                <p className="text-xs text-slate-500">Attendance</p>
                <p className="text-2xl font-semibold text-slate-900">{percent(event.stats.rate)}</p>
                <p className="text-xs text-slate-500">
                  {event.stats.attended} attended · {event.stats.excused} excused · {event.stats.absent} absent
                </p>
              </>
            ) : (
              <>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Registration</span>
                  <span className="font-medium text-slate-700">
                    {registered}
                    {event.capacity ? ` / ${event.capacity}` : ''}
                  </span>
                </div>
                {event.capacity && <ProgressBar value={registered} max={event.capacity} className="mt-2" />}
                {event.capacity && <p className="mt-2 text-xs text-slate-500">{Math.max(0, event.capacity - registered)} places remain</p>}
              </>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {event.status === 'published' && (
            <Button to={`/officer/events/${event.id}/attendance`} icon={<ClipboardCheck className="size-4" />}>
              {event.display_status === 'completed' ? 'View attendance' : 'Manage attendance'}
            </Button>
          )}
          {isDraft && (
            <Button loading={submit.isPending} onClick={() => submit.mutate()} icon={<Send className="size-4" />}>
              {campus?.require_event_approval ? 'Submit for approval' : 'Publish event'}
            </Button>
          )}
          {canEdit && (
            <Button variant="secondary" to={`/officer/events/${event.id}/edit`} icon={<Pencil className="size-4" />}>
              Edit event
            </Button>
          )}
          {(event.status === 'published' || event.status === 'pending') && event.display_status !== 'completed' && (
            <Button variant="danger" loading={cancel.isPending} icon={<Ban className="size-4" />} onClick={() => window.confirm('Cancel this event? Registered students will be notified.') && cancel.mutate()}>
              Cancel event
            </Button>
          )}
          {isDraft && (
            <Button variant="ghost" className="text-red-600" loading={remove.isPending} icon={<Trash2 className="size-4" />} onClick={() => window.confirm('Delete this draft?') && remove.mutate()}>
              Delete draft
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  )
}

export default function OfficerEventsPage() {
  useDocumentTitle('Events')
  const { activeOrganization } = useAuth()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<EventTab>('upcoming')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['officer', 'events', activeOrganization?.id, tab],
    queryFn: () => officerApi.events(tab),
  })

  useEffect(() => {
    if (data?.data.length && !data.data.some((e) => e.id === selectedId)) setSelectedId(data.data[0].id)
  }, [data, selectedId])

  const selected = data?.data.find((e) => e.id === selectedId)

  return (
    <>
      <PageHeader
        eyebrow={activeOrganization?.name}
        title="Events management"
        description="Plan, submit and monitor your organization's events for the academic year."
        actions={
          <Button to="/officer/events/new" icon={<Plus className="size-4" />}>
            Create event
          </Button>
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'upcoming', label: 'Upcoming', count: data?.counts.upcoming },
          { value: 'past', label: 'Past', count: data?.counts.past },
          { value: 'drafts', label: 'Drafts & approvals', count: data?.counts.drafts },
          { value: 'cancelled', label: 'Cancelled', count: data?.counts.cancelled },
        ]}
      />

      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={tab === 'upcoming' ? 'Upcoming events' : tab === 'past' ? 'Past events' : tab === 'drafts' ? 'Drafts & approvals' : 'Cancelled'} />
          <CardBody className="pt-3">
            {error ? (
              <ErrorState error={error} onRetry={refetch} />
            ) : isLoading ? (
              <div className="h-64 animate-pulse rounded-xl bg-slate-50" />
            ) : data?.data.length ? (
              <ul className="space-y-2">
                {data.data.map((event, i) => {
                  const status = eventStatus[event.display_status]
                  return (
                    <li key={event.id}>
                      <button
                        onClick={() => setSelectedId(event.id)}
                        className={cn(
                          'flex w-full items-center gap-4 rounded-xl border p-3 text-left transition',
                          selectedId === event.id ? 'border-blue-200 bg-blue-50/50' : 'border-transparent hover:bg-slate-50',
                        )}
                      >
                        <DateTile iso={event.starts_at} highlight={tab === 'upcoming' && i === 0} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="truncate text-sm font-semibold text-slate-900">{event.title}</p>
                            <Badge tone="blue">{event.type}</Badge>
                            {event.is_mandatory && <Badge tone="red">Required</Badge>}
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {formatTimeRange(event.starts_at, event.ends_at)} · {event.venue}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {event.stats && tab === 'past' ? `${percent(event.stats.rate)} attendance` : `${event.registrations_count ?? 0} registered`}
                          </p>
                        </div>
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <EmptyState
                icon={<CalendarDays />}
                title={tab === 'drafts' ? 'No drafts' : 'No events here'}
                action={tab !== 'past' && tab !== 'cancelled' ? <Button to="/officer/events/new">Create event</Button> : undefined}
              />
            )}
          </CardBody>
        </Card>

        <div>{selected && <EventPanel key={selected.id} event={selected} onChanged={() => queryClient.invalidateQueries({ queryKey: ['officer'] })} />}</div>
      </div>
    </>
  )
}
