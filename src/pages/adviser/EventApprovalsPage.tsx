import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarCheck2, Check, Clock, Lock, MapPin, Mic, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { adviserApi, type ApprovalTab } from '@/api/adviser'
import { getErrorMessage } from '@/api/client'
import { ReviewModal } from '@/components/shared/ReviewModal'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { EmptyState, ErrorState } from '@/components/ui/Feedback'
import { DateTile, OrgMark, PageHeader, Tabs } from '@/components/ui/Misc'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDate, formatTimeRange, percent, relativeTime } from '@/lib/format'
import { eventStatus } from '@/lib/status'
import type { CampusEvent } from '@/types'

export default function EventApprovalsPage() {
  useDocumentTitle('Event approvals')
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const tab = (['pending', 'upcoming', 'completed', 'rejected'].includes(params.get('tab') ?? '') ? params.get('tab') : 'pending') as ApprovalTab
  const [review, setReview] = useState<{ event: CampusEvent; mode: 'approve' | 'reject' } | null>(null)

  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['adviser', 'events', tab], queryFn: () => adviserApi.events(tab) })

  const decide = useMutation({
    mutationFn: ({ event, mode, note }: { event: CampusEvent; mode: 'approve' | 'reject'; note: string }) =>
      mode === 'approve' ? adviserApi.approveEvent(event.id, note) : adviserApi.rejectEvent(event.id, note),
    onSuccess: (_, { mode }) => {
      toast.success(mode === 'approve' ? 'Event approved and published.' : 'Event returned to the officers.')
      setReview(null)
      queryClient.invalidateQueries({ queryKey: ['adviser'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  return (
    <>
      <PageHeader
        eyebrow="Student affairs"
        title="Event approvals"
        description="Review activity proposals from organizations. This replaces routing paper proposals for signatures — officers see your decision instantly."
      />

      <Tabs
        value={tab}
        onChange={(value) => setParams({ tab: value }, { replace: true })}
        items={[
          { value: 'pending', label: 'Waiting for review', count: data?.counts.pending },
          { value: 'upcoming', label: 'Approved · upcoming', count: data?.counts.upcoming },
          { value: 'completed', label: 'Completed', count: data?.counts.completed },
          { value: 'rejected', label: 'Returned', count: data?.counts.rejected },
        ]}
      />

      <div className="mt-4 space-y-3">
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-white" />
        ) : data?.data.length ? (
          data.data.map((event) => (
            <Card key={event.id}>
              <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <DateTile iso={event.starts_at} highlight={tab === 'pending'} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="text-base font-semibold text-slate-900">{event.title}</h3>
                    <Badge tone="blue">{event.type}</Badge>
                    {event.is_mandatory && <Badge tone="red">Required</Badge>}
                    {tab !== 'pending' && <Badge tone={eventStatus[event.display_status].tone}>{eventStatus[event.display_status].label}</Badge>}
                  </div>
                  {event.organization && (
                    <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <OrgMark acronym={event.organization.acronym} color={event.organization.color} size="sm" />
                      {event.organization.name}
                      {event.creator && ` · submitted by ${event.creator.name}`}
                      {event.submitted_at && ` ${relativeTime(event.submitted_at)}`}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {formatDate(event.starts_at, { weekday: 'short', month: 'short', day: 'numeric' })} · {formatTimeRange(event.starts_at, event.ends_at)}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {event.venue}</span>
                    {event.speaker && <span className="inline-flex items-center gap-1"><Mic className="size-3.5" /> {event.speaker}</span>}
                    <span className="inline-flex items-center gap-1">
                      {event.visibility === 'members' ? <Lock className="size-3.5" /> : <Users className="size-3.5" />}
                      {event.visibility === 'members' ? 'Members only' : 'Open to all students'}
                      {event.capacity ? ` · ${event.capacity} max` : ''}
                    </span>
                  </div>
                  {event.description && <p className="mt-3 text-sm text-slate-600">{event.description}</p>}
                  {event.review_note && tab === 'rejected' && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">Your note: {event.review_note}</p>}
                  {tab === 'completed' && event.stats && (
                    <p className="mt-3 text-xs text-slate-500">
                      Attendance <span className="font-semibold text-slate-800">{percent(event.stats.rate)}</span> · {event.stats.attended} attended · {event.stats.absent} absent
                    </p>
                  )}
                  {tab === 'upcoming' && <p className="mt-3 text-xs text-slate-500">{event.registrations_count ?? 0} registered so far</p>}
                </div>
                {tab === 'pending' && (
                  <div className="flex gap-2 sm:flex-col">
                    <Button variant="success" icon={<Check className="size-4" />} onClick={() => setReview({ event, mode: 'approve' })}>
                      Approve
                    </Button>
                    <Button variant="danger" icon={<X className="size-4" />} onClick={() => setReview({ event, mode: 'reject' })}>
                      Return
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          ))
        ) : (
          <Card>
            <EmptyState icon={<CalendarCheck2 />} title={tab === 'pending' ? 'No proposals waiting' : 'Nothing here'} description={tab === 'pending' ? 'New submissions show up here and in your notifications.' : undefined} />
          </Card>
        )}
      </div>

      <ReviewModal
        open={!!review}
        onClose={() => setReview(null)}
        mode={review?.mode ?? 'approve'}
        title={review?.mode === 'approve' ? 'Approve and publish this event?' : 'Return this event for revision?'}
        description={review ? `${review.event.organization?.acronym} · ${review.event.title}` : undefined}
        noteRequired={review?.mode === 'reject'}
        loading={decide.isPending}
        onConfirm={(note) => review && decide.mutate({ ...review, note })}
      />
    </>
  )
}
