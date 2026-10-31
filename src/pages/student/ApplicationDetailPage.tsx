import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Check, ChevronRight, Circle, Clock, Info, X } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api/client'
import { studentApi } from '@/api/student'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Alert, ErrorState, PageLoader } from '@/components/ui/Feedback'
import { OrgMark, PageHeader } from '@/components/ui/Misc'
import { useAuth } from '@/context/AuthContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/cn'
import { formatDate, formatDateTime } from '@/lib/format'
import { applicationStatus } from '@/lib/status'
import type { Application } from '@/types'

type StepState = 'done' | 'current' | 'pending' | 'failed'

function steps(app: Application): { label: string; detail: string; state: StepState }[] {
  const decided = app.status === 'approved' || app.status === 'rejected'

  return [
    { label: 'Application submitted', detail: formatDateTime(app.submitted_at), state: 'done' },
    { label: 'Eligibility verified', detail: app.eligibility_verified_at ? formatDateTime(app.eligibility_verified_at) : 'Checking enrollment', state: app.eligibility_verified_at ? 'done' : 'current' },
    {
      label: 'Officer review',
      detail: decided ? `Reviewed${app.reviewer ? ` by ${app.reviewer}` : ''}` : app.status === 'withdrawn' ? 'Stopped' : 'In progress',
      state: decided ? 'done' : app.status === 'withdrawn' ? 'failed' : 'current',
    },
    {
      label: 'Decision',
      detail: app.status === 'approved' ? `Approved ${formatDate(app.reviewed_at)}` : app.status === 'rejected' ? `Not approved ${formatDate(app.reviewed_at)}` : app.status === 'withdrawn' ? 'You withdrew this application' : 'Pending',
      state: app.status === 'approved' ? 'done' : app.status === 'rejected' || app.status === 'withdrawn' ? 'failed' : 'pending',
    },
  ]
}

function StepIcon({ state }: { state: StepState }) {
  const styles: Record<StepState, string> = {
    done: 'bg-emerald-500 text-white',
    current: 'bg-amber-100 text-amber-600 ring-4 ring-amber-50',
    pending: 'bg-slate-100 text-slate-400',
    failed: 'bg-red-100 text-red-600',
  }
  const icons = { done: <Check className="size-3.5" />, current: <Clock className="size-3.5" />, pending: <Circle className="size-3" />, failed: <X className="size-3.5" /> }

  return <span className={cn('relative z-10 grid size-7 place-items-center rounded-full', styles[state])}>{icons[state]}</span>
}

export default function ApplicationDetailPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: app, isLoading, error, refetch } = useQuery({ queryKey: ['student', 'application', id], queryFn: () => studentApi.application(id) })
  useDocumentTitle('Application status')

  const withdraw = useMutation({
    mutationFn: () => studentApi.withdrawApplication(Number(id)),
    onSuccess: () => {
      toast.success('Application withdrawn.')
      queryClient.invalidateQueries({ queryKey: ['student'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  if (isLoading) return <PageLoader />
  if (error || !app) return <ErrorState error={error} onRetry={refetch} />

  const org = app.organization
  const status = applicationStatus[app.status]

  return (
    <>
      <nav className="mb-4 flex items-center gap-1 text-xs text-slate-500" aria-label="Breadcrumb">
        <Link to="/applications" className="hover:text-blue-600">Applications</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-slate-700">{app.reference}</span>
      </nav>

      <PageHeader
        eyebrow="Membership application"
        title="Application status"
        description={`Track your request to join ${org?.name ?? 'the organization'} and review what you submitted.`}
        actions={
          <Button variant="secondary" to="/discover" icon={<BookOpen className="size-4" />}>
            Browse organizations
          </Button>
        }
      />

      <Card className="mb-6">
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {org && <OrgMark acronym={org.acronym} color={org.color} size="lg" />}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">{org?.name}</h2>
                <Badge tone={status.tone}>{status.label}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Application #{app.reference} · Submitted {formatDate(app.submitted_at, { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          {app.status === 'pending' && (
            <div className="text-left sm:text-right">
              <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Expected response</p>
              <p className="text-sm font-semibold text-slate-800">Within 5 school days</p>
            </div>
          )}
          {app.status === 'approved' && org && <Button to={`/organizations/${org.slug}`}>Go to organization</Button>}
        </CardBody>
      </Card>

      {app.review_note && (
        <Alert tone={app.status === 'approved' ? 'success' : 'warning'} className="mb-6" title="Message from the officers">
          {app.review_note}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Review progress" subtitle="Officers usually respond within 5 school days" />
            <CardBody>
              <ol className="relative space-y-6 before:absolute before:top-2 before:bottom-2 before:left-3.5 before:w-px before:bg-slate-200">
                {steps(app).map((step) => (
                  <li key={step.label} className="flex gap-3">
                    <StepIcon state={step.state} />
                    <div>
                      <p className={cn('text-sm font-medium', step.state === 'pending' ? 'text-slate-400' : 'text-slate-800')}>{step.label}</p>
                      <p className="text-xs text-slate-500">{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>

          <Alert tone="info" icon={<Info />} title="What happens next?">
            {app.status === 'pending'
              ? "An officer will review your interests and availability. You'll get an in-app notification as soon as a decision is made."
              : app.status === 'approved'
                ? "You're now a member. Check the organization page for upcoming events and required meetings."
                : 'You can apply to other organizations anytime, or try again next semester.'}
          </Alert>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Submitted application"
            subtitle="Your answers are locked while under review"
            action={
              app.status === 'pending' && (
                <Button variant="danger" size="sm" icon={<X className="size-3.5" />} loading={withdraw.isPending} onClick={() => window.confirm('Withdraw this application?') && withdraw.mutate()}>
                  Withdraw application
                </Button>
              )
            }
          />
          <CardBody className="divide-y divide-slate-100 [&>div]:py-4 [&>div:first-child]:pt-0">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-slate-500">Academic program</p>
                <p className="mt-1 text-sm text-slate-800">{user?.program_label}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Student ID</p>
                <p className="mt-1 text-sm text-slate-800">{user?.id_number}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Why would you like to join?</p>
              <p className="mt-1 text-sm whitespace-pre-line text-slate-800">{app.reason}</p>
            </div>
            {app.answer && (
              <div>
                <p className="text-xs font-semibold text-slate-500">{org?.application_question ?? 'Additional answer'}</p>
                <p className="mt-1 text-sm whitespace-pre-line text-slate-800">{app.answer}</p>
              </div>
            )}
            {app.experience && (
              <div>
                <p className="text-xs font-semibold text-slate-500">Relevant experience</p>
                <p className="mt-1 text-sm whitespace-pre-line text-slate-800">{app.experience}</p>
              </div>
            )}
            {app.availability && (
              <div>
                <p className="text-xs font-semibold text-slate-500">Weekly availability</p>
                <p className="mt-1 text-sm text-slate-800">{app.availability}</p>
              </div>
            )}
            <div className="flex items-start gap-2 text-xs text-slate-500">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />I agreed to follow the {org?.acronym} constitution, the CPC Student Handbook and safety rules for organization activities.
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
