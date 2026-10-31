import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronDown, ChevronUp, UserPlus, X } from 'lucide-react'
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
import { applicationStatus } from '@/lib/status'
import type { Application } from '@/types'

type Status = 'pending' | 'approved' | 'rejected' | 'all'

function ApplicationRow({ app, onReview }: { app: Application; onReview: (mode: 'approve' | 'reject') => void }) {
  const [open, setOpen] = useState(app.status === 'pending')

  return (
    <li className="px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button onClick={() => setOpen((v) => !v)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <Avatar initials={app.applicant?.initials ?? '?'} name={app.applicant?.name} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{app.applicant?.name}</p>
            <p className="text-xs text-slate-500">
              {app.applicant?.id_number} · {app.applicant?.program_label} · {relativeTime(app.submitted_at)}
            </p>
          </div>
          {open ? <ChevronUp className="ml-auto size-4 text-slate-400" /> : <ChevronDown className="ml-auto size-4 text-slate-400" />}
        </button>
        {app.status === 'pending' ? (
          <div className="flex gap-2">
            <Button size="sm" variant="success" icon={<Check className="size-3.5" />} onClick={() => onReview('approve')}>
              Approve
            </Button>
            <Button size="sm" variant="danger" icon={<X className="size-3.5" />} onClick={() => onReview('reject')}>
              Decline
            </Button>
          </div>
        ) : (
          <Badge tone={applicationStatus[app.status].tone}>{applicationStatus[app.status].label}</Badge>
        )}
      </div>

      {open && (
        <div className="mt-4 grid gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2 sm:pl-16">
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold text-slate-500">Why they want to join</p>
            <p className="mt-1 whitespace-pre-line text-slate-800">{app.reason}</p>
          </div>
          {app.answer && (
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold text-slate-500">{app.organization?.application_question ?? 'Answer'}</p>
              <p className="mt-1 text-slate-800">{app.answer}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-slate-500">Experience</p>
            <p className="mt-1 text-slate-800">{app.experience || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Availability</p>
            <p className="mt-1 text-slate-800">{app.availability || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Contact</p>
            <p className="mt-1 text-slate-800">{app.applicant?.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Reference</p>
            <p className="mt-1 text-slate-800">
              {app.reference} · {formatDate(app.submitted_at)}
            </p>
          </div>
          {app.review_note && (
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold text-slate-500">Note sent{app.reviewer ? ` by ${app.reviewer}` : ''}</p>
              <p className="mt-1 text-slate-800">{app.review_note}</p>
            </div>
          )}
        </div>
      )}
    </li>
  )
}

export default function OfficerApplicationsPage() {
  useDocumentTitle('Membership')
  const { activeOrganization } = useAuth()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<Status>('pending')
  const [review, setReview] = useState<{ app: Application; mode: 'approve' | 'reject' } | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['officer', 'applications', activeOrganization?.id, status],
    queryFn: () => officerApi.applications(status),
  })

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

  const counts = data?.counts ?? {}
  const total = Object.values(counts).reduce((a, b) => a + Number(b), 0)

  return (
    <>
      <PageHeader eyebrow={activeOrganization?.name} title="Membership applications" description="Review students who want to join. Applicants get a notification with your decision." />

      <Tabs
        value={status}
        onChange={setStatus}
        items={[
          { value: 'pending', label: 'Pending', count: Number(counts.pending ?? 0) },
          { value: 'approved', label: 'Approved', count: Number(counts.approved ?? 0) },
          { value: 'rejected', label: 'Declined', count: Number(counts.rejected ?? 0) },
          { value: 'all', label: 'All', count: total },
        ]}
      />

      <Card className="mt-4">
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isLoading ? (
          <div className="h-64 animate-pulse" />
        ) : data?.data.length ? (
          <ul className="divide-y divide-slate-100">
            {data.data.map((app) => (
              <ApplicationRow key={app.id} app={app} onReview={(mode) => setReview({ app, mode })} />
            ))}
          </ul>
        ) : (
          <EmptyState icon={<UserPlus />} title={status === 'pending' ? 'No pending applications' : 'Nothing here yet'} description={status === 'pending' ? 'New applications will appear here and in your notifications.' : undefined} />
        )}
      </Card>

      <ReviewModal
        open={!!review}
        onClose={() => setReview(null)}
        mode={review?.mode ?? 'approve'}
        title={review?.mode === 'approve' ? `Approve ${review?.app.applicant?.name}?` : `Decline ${review?.app.applicant?.name}?`}
        description={review?.mode === 'approve' ? 'They will be added as a member right away.' : 'They can apply again in the future.'}
        loading={decide.isPending}
        onConfirm={(note) => review && decide.mutate({ ...review, note })}
      />
    </>
  )
}
