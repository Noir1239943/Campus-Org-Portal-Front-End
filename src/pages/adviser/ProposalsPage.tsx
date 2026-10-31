import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ExternalLink, Lightbulb, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { adviserApi } from '@/api/adviser'
import { getErrorMessage } from '@/api/client'
import { ReviewModal } from '@/components/shared/ReviewModal'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { EmptyState, ErrorState } from '@/components/ui/Feedback'
import { Avatar, OrgMark, PageHeader, Tabs } from '@/components/ui/Misc'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { relativeTime } from '@/lib/format'
import { categoryTone, proposalStatus } from '@/lib/status'
import type { OrganizationProposal, ProposalStatus } from '@/types'

type Tab = 'pending' | 'approved' | 'rejected' | 'all'
const tabs: Tab[] = ['pending', 'approved', 'rejected', 'all']

export default function ProposalsPage() {
  useDocumentTitle('New organization proposals')
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const tab = (tabs.includes(params.get('tab') as Tab) ? params.get('tab') : 'pending') as Tab
  const [review, setReview] = useState<{ proposal: OrganizationProposal; mode: 'approve' | 'reject' } | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adviser', 'proposals', tab],
    queryFn: () => adviserApi.proposals(tab as ProposalStatus | 'all'),
  })

  const decide = useMutation({
    mutationFn: ({ proposal, mode, note }: { proposal: OrganizationProposal; mode: 'approve' | 'reject'; note: string }) =>
      mode === 'approve' ? adviserApi.approveProposal(proposal.id, note) : adviserApi.rejectProposal(proposal.id, note),
    onSuccess: (_, { mode, proposal }) => {
      toast.success(mode === 'approve' ? `${proposal.name} was created. ${proposal.proposer?.name} is now its President.` : 'Proposal returned to the student.')
      setReview(null)
      queryClient.invalidateQueries({ queryKey: ['adviser'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  return (
    <>
      <PageHeader
        eyebrow="Student affairs"
        title="New organization proposals"
        description="Students cannot create organizations directly. Approving a proposal creates the organization and makes the student its President."
      />

      <Tabs
        value={tab}
        onChange={(value) => setParams({ tab: value }, { replace: true })}
        items={[
          { value: 'pending', label: 'Waiting', count: data?.counts.pending },
          { value: 'approved', label: 'Approved', count: data?.counts.approved },
          { value: 'rejected', label: 'Returned', count: data?.counts.rejected },
          { value: 'all', label: 'All', count: data?.counts.all },
        ]}
      />

      <div className="mt-4 space-y-3">
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-white" />
        ) : data?.data.length ? (
          data.data.map((p) => (
            <Card key={p.id}>
              <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <OrgMark acronym={p.acronym} color="#2563eb" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="text-base font-semibold text-slate-900">{p.name}</h3>
                    <Badge tone={categoryTone[p.category] ?? 'gray'}>{p.category}</Badge>
                    <Badge tone={proposalStatus[p.status].tone}>{proposalStatus[p.status].label}</Badge>
                  </div>
                  {p.proposer && (
                    <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <Avatar initials={p.proposer.initials} name={p.proposer.name} size="sm" />
                      Proposed by {p.proposer.name} ({p.proposer.id_number} · {p.proposer.program_label}) · {relativeTime(p.created_at)} · {p.reference}
                    </p>
                  )}

                  <p className="mt-3 text-sm text-slate-700">{p.description}</p>

                  <dl className="mt-3 space-y-3 text-sm">
                    <div>
                      <dt className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Purpose</dt>
                      <dd className="mt-0.5 whitespace-pre-line text-slate-600">{p.purpose}</dd>
                    </div>
                    {p.planned_activities && (
                      <div>
                        <dt className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Planned activities</dt>
                        <dd className="mt-0.5 whitespace-pre-line text-slate-600">{p.planned_activities}</dd>
                      </div>
                    )}
                  </dl>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span>Proposed adviser: <span className="font-medium text-slate-800">{p.adviser_name ?? 'None yet'}</span></span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3.5" /> {p.expected_members ? `${p.expected_members} expected members` : 'Expected members not stated'}
                    </span>
                  </div>

                  {p.review_note && p.status !== 'pending' && (
                    <p className={`mt-3 rounded-lg px-3 py-2 text-xs ${p.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>Your note: {p.review_note}</p>
                  )}
                  {p.status === 'approved' && p.organization && (
                    <Link to={`/adviser/organizations/${p.organization.id}`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline">
                      <ExternalLink className="size-4" /> Open {p.organization.acronym}
                    </Link>
                  )}
                </div>

                {p.status === 'pending' && (
                  <div className="flex gap-2 sm:flex-col">
                    <Button variant="success" icon={<Check className="size-4" />} onClick={() => setReview({ proposal: p, mode: 'approve' })}>
                      Approve &amp; create
                    </Button>
                    <Button variant="danger" icon={<X className="size-4" />} onClick={() => setReview({ proposal: p, mode: 'reject' })}>
                      Return
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          ))
        ) : (
          <Card>
            <EmptyState
              icon={<Lightbulb />}
              title={tab === 'pending' ? 'No proposals waiting' : 'Nothing here'}
              description={tab === 'pending' ? 'When a student proposes a new organization it shows up here and in your notifications.' : undefined}
            />
          </Card>
        )}
      </div>

      <ReviewModal
        open={!!review}
        onClose={() => setReview(null)}
        mode={review?.mode ?? 'approve'}
        title={review?.mode === 'approve' ? 'Approve and create this organization?' : 'Return this proposal?'}
        description={review ? `${review.proposal.name} (${review.proposal.acronym}) — ${review.proposal.proposer?.name} will become its President.` : undefined}
        noteRequired={review?.mode === 'reject'}
        loading={decide.isPending}
        onConfirm={(note) => review && decide.mutate({ ...review, note })}
      />
    </>
  )
}
