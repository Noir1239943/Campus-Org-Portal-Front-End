import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, FileCheck2, X } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api/client'
import { officerApi } from '@/api/officer'
import { ReviewModal } from '@/components/shared/ReviewModal'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState } from '@/components/ui/Feedback'
import { Avatar, PageHeader, Tabs } from '@/components/ui/Misc'
import { useAuth } from '@/context/AuthContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDate, relativeTime } from '@/lib/format'
import { excuseStatus } from '@/lib/status'
import type { Excuse } from '@/types'

type Status = 'pending' | 'approved' | 'rejected' | 'all'

export default function ExcusesPage() {
  useDocumentTitle('Excuses')
  const { activeOrganization } = useAuth()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<Status>('pending')
  const [review, setReview] = useState<{ excuse: Excuse; mode: 'approve' | 'reject' } | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['officer', 'excuses', activeOrganization?.id, status],
    queryFn: () => officerApi.excuses(status),
  })

  const decide = useMutation({
    mutationFn: ({ excuse, mode, note }: { excuse: Excuse; mode: 'approve' | 'reject'; note: string }) =>
      mode === 'approve' ? officerApi.approveExcuse(excuse.id, note) : officerApi.rejectExcuse(excuse.id, note),
    onSuccess: (_, { mode }) => {
      toast.success(mode === 'approve' ? 'Excuse approved — marked as excused.' : 'Excuse declined.')
      setReview(null)
      queryClient.invalidateQueries({ queryKey: ['officer'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const counts = data?.counts ?? {}

  return (
    <>
      <PageHeader
        eyebrow={activeOrganization?.name}
        title="Excuse requests"
        description="Students explain why they missed (or can't attend) an event. Approved excuses don't count against attendance or clearance."
      />

      <Tabs
        value={status}
        onChange={setStatus}
        items={[
          { value: 'pending', label: 'Pending', count: Number(counts.pending ?? 0) },
          { value: 'approved', label: 'Approved', count: Number(counts.approved ?? 0) },
          { value: 'rejected', label: 'Declined', count: Number(counts.rejected ?? 0) },
          { value: 'all', label: 'All' },
        ]}
      />

      <Card className="mt-4">
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isLoading ? (
          <div className="h-64 animate-pulse" />
        ) : data?.data.length ? (
          <ul className="divide-y divide-slate-100">
            {data.data.map((excuse) => (
              <li key={excuse.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-start">
                <Avatar initials={excuse.student?.initials ?? '?'} name={excuse.student?.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{excuse.student?.name}</p>
                    <span className="text-xs text-slate-400">{excuse.student?.id_number}</span>
                    <Badge tone="gray">{excuse.reason_label}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    For <span className="font-medium text-slate-700">{excuse.event?.title}</span> · {formatDate(excuse.event?.starts_at)} · filed {relativeTime(excuse.submitted_at)}
                  </p>
                  <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{excuse.details}</p>
                  {excuse.review_note && <p className="mt-2 text-xs text-slate-500">Note: {excuse.review_note}</p>}
                </div>
                {excuse.status === 'pending' ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="success" icon={<Check className="size-3.5" />} onClick={() => setReview({ excuse, mode: 'approve' })}>
                      Approve
                    </Button>
                    <Button size="sm" variant="danger" icon={<X className="size-3.5" />} onClick={() => setReview({ excuse, mode: 'reject' })}>
                      Decline
                    </Button>
                  </div>
                ) : (
                  <Badge tone={excuseStatus[excuse.status].tone}>{excuse.status === 'approved' ? 'Approved' : 'Declined'}</Badge>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<FileCheck2 />} title={status === 'pending' ? 'No excuses waiting' : 'Nothing here'} />
        )}
      </Card>

      <ReviewModal
        open={!!review}
        onClose={() => setReview(null)}
        mode={review?.mode ?? 'approve'}
        title={review?.mode === 'approve' ? 'Approve this excuse?' : 'Decline this excuse?'}
        description={review ? `${review.excuse.student?.name} · ${review.excuse.event?.title}` : undefined}
        loading={decide.isPending}
        onConfirm={(note) => review && decide.mutate({ ...review, note })}
      />
    </>
  )
}
