import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Compass, FileText, Lightbulb } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api/client'
import { studentApi } from '@/api/student'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/Feedback'
import { OrgMark, PageHeader, Tabs } from '@/components/ui/Misc'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDate } from '@/lib/format'
import { applicationStatus, proposalStatus } from '@/lib/status'

type Tab = 'applications' | 'proposals'

export default function ApplicationsPage() {
  useDocumentTitle('Applications')
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('tab') === 'proposals' ? 'proposals' : 'applications'

  const applications = useQuery({ queryKey: ['student', 'applications'], queryFn: studentApi.applications })
  const proposals = useQuery({ queryKey: ['student', 'proposals'], queryFn: studentApi.proposals })

  const withdraw = useMutation({
    mutationFn: (id: number) => studentApi.withdrawProposal(id),
    onSuccess: () => {
      toast.success('Proposal withdrawn.')
      queryClient.invalidateQueries({ queryKey: ['student', 'proposals'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const active = tab === 'applications' ? applications : proposals

  if (active.isLoading) return <PageLoader />
  if (active.error) return <ErrorState error={active.error} onRetry={active.refetch} />

  return (
    <>
      <PageHeader
        eyebrow="Membership & new organizations"
        title="My applications"
        description="Track every organization you applied to, and any new organization you proposed."
        actions={
          <>
            <Button variant="secondary" to="/propose-organization" icon={<Lightbulb className="size-4" />}>
              Start an organization
            </Button>
            <Button variant="secondary" to="/discover" icon={<Compass className="size-4" />}>
              Browse organizations
            </Button>
          </>
        }
      />

      <Tabs
        className="mb-4"
        value={tab}
        onChange={(value) => setParams(value === 'proposals' ? { tab: value } : {}, { replace: true })}
        items={[
          { value: 'applications', label: 'Membership applications', count: applications.data?.length },
          { value: 'proposals', label: 'New organization proposals', count: proposals.data?.length },
        ]}
      />

      <Card>
        {tab === 'applications' ? (
          applications.data?.length ? (
            <ul className="divide-y divide-slate-100">
              {applications.data.map((app) => (
                <li key={app.id}>
                  <Link to={`/applications/${app.id}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50">
                    {app.organization && <OrgMark acronym={app.organization.acronym} color={app.organization.color} />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{app.organization?.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {app.reference} · Submitted {formatDate(app.submitted_at)}
                      </p>
                    </div>
                    <Badge tone={applicationStatus[app.status].tone}>{applicationStatus[app.status].label}</Badge>
                    <ChevronRight className="hidden size-4 text-slate-300 sm:block" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={<FileText />} title="No applications yet" description="Find an organization you like and apply in a few minutes." action={<Button to="/discover">Discover organizations</Button>} />
          )
        ) : proposals.data?.length ? (
          <ul className="divide-y divide-slate-100">
            {proposals.data.map((p) => (
              <li key={p.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <OrgMark acronym={p.acronym} color={p.organization?.color ?? '#2563eb'} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{p.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {p.reference} · Submitted {formatDate(p.created_at)}
                  </p>
                  {p.review_note && (
                    <p className={`mt-2 rounded-lg px-3 py-2 text-xs ${p.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-600'}`}>OSA note: {p.review_note}</p>
                  )}
                </div>
                <Badge tone={proposalStatus[p.status].tone}>{proposalStatus[p.status].label}</Badge>
                {p.status === 'pending' && (
                  <Button size="sm" variant="secondary" loading={withdraw.isPending && withdraw.variables === p.id} onClick={() => window.confirm('Withdraw this proposal?') && withdraw.mutate(p.id)}>
                    Withdraw
                  </Button>
                )}
                {p.status === 'approved' && (
                  <Button size="sm" to="/officer/organization">
                    Set up {p.acronym}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<Lightbulb />}
            title="No proposals yet"
            description="Can't find a group that fits you? Propose a new organization to the OSA."
            action={<Button to="/propose-organization">Start an organization</Button>}
          />
        )}
      </Card>
    </>
  )
}
