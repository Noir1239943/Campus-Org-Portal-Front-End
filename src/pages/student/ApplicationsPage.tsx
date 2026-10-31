import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Compass, FileText } from 'lucide-react'
import { studentApi } from '@/api/student'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/Feedback'
import { OrgMark, PageHeader } from '@/components/ui/Misc'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDate } from '@/lib/format'
import { applicationStatus } from '@/lib/status'

export default function ApplicationsPage() {
  useDocumentTitle('Applications')
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['student', 'applications'], queryFn: studentApi.applications })

  if (isLoading) return <PageLoader />
  if (error || !data) return <ErrorState error={error} onRetry={refetch} />

  return (
    <>
      <PageHeader
        eyebrow="Membership applications"
        title="My applications"
        description="Track every organization you applied to and the officers' decisions."
        actions={
          <Button variant="secondary" to="/discover" icon={<Compass className="size-4" />}>
            Browse organizations
          </Button>
        }
      />

      <Card>
        {data.length ? (
          <ul className="divide-y divide-slate-100">
            {data.map((app) => (
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
        )}
      </Card>
    </>
  )
}
