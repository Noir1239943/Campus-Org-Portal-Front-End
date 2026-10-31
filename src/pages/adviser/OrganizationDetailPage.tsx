import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarCheck2, CalendarDays, ChevronRight, Mail, Pencil, Users } from 'lucide-react'
import { toast } from 'sonner'
import { adviserApi } from '@/api/adviser'
import { getErrorMessage } from '@/api/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/Feedback'
import { Field, Select, Textarea } from '@/components/ui/Field'
import { OfficersCard } from '@/components/shared/OfficersCard'
import { DateTile, OrgMark, PageHeader } from '@/components/ui/Misc'
import { Modal } from '@/components/ui/Modal'
import { StatCard } from '@/components/ui/StatCard'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatTimeRange, percent } from '@/lib/format'
import { eventStatus, healthStatus, orgStatus } from '@/lib/status'

export default function AdviserOrganizationDetailPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const [statusOpen, setStatusOpen] = useState(false)
  const [statusForm, setStatusForm] = useState({ status: 'active', note: '' })
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['adviser', 'organization', id], queryFn: () => adviserApi.organization(id) })
  useDocumentTitle(data?.organization.name ?? 'Organization')

  const updateStatus = useMutation({
    mutationFn: () => adviserApi.updateOrganizationStatus(Number(id), statusForm),
    onSuccess: (res) => {
      toast.success(res.message)
      setStatusOpen(false)
      queryClient.invalidateQueries({ queryKey: ['adviser'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  if (isLoading) return <PageLoader />
  if (error || !data) return <ErrorState error={error} onRetry={refetch} />

  const { organization: org, health, officers } = data

  return (
    <>
      <nav className="mb-4 flex items-center gap-1 text-xs text-slate-500" aria-label="Breadcrumb">
        <Link to="/adviser/organizations" className="hover:text-blue-600">Organizations</Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-slate-700">{org.acronym}</span>
      </nav>

      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <OrgMark acronym={org.acronym} color={org.color} />
            {org.name}
          </span>
        }
        description={`${org.category} · ${org.adviser_name ?? 'No adviser listed'}`}
        actions={
          <>
            <Badge tone={orgStatus[org.status].tone}>{orgStatus[org.status].label}</Badge>
            <Badge tone={healthStatus[health.health].tone}>{healthStatus[health.health].label}</Badge>
            <Button variant="secondary" to={`/adviser/organizations/${org.id}/edit`} icon={<Pencil className="size-4" />}>
              Edit details
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setStatusForm({ status: org.status, note: '' })
                setStatusOpen(true)
              }}
            >
              Change status
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Members" value={health.members_count} icon={<Users />} />
        <StatCard label="Completed events" value={health.completed_events} icon={<CalendarCheck2 />} tone="green" />
        <StatCard label="Upcoming" value={health.upcoming_events_count} icon={<CalendarDays />} tone="violet" />
        <StatCard label="Average attendance" value={percent(health.attendance_rate)} hint={`${health.pending_applications_count} pending applications`} tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Recent events & attendance" />
            <CardBody className="divide-y divide-slate-100 pt-2">
              {data.recent_events.length ? (
                data.recent_events.map((e) => (
                  <div key={e.id} className="flex items-center gap-4 py-3">
                    <DateTile iso={e.starts_at} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {e.title} {e.is_mandatory && <Badge tone="red">Required</Badge>}
                      </p>
                      <p className="text-xs text-slate-500">
                        {e.stats?.attended ?? 0} attended · {e.stats?.excused ?? 0} excused · {e.stats?.absent ?? 0} absent
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{percent(e.stats?.rate)}</span>
                  </div>
                ))
              ) : (
                <EmptyState title="No completed events yet" />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Upcoming & pending" />
            <CardBody className="divide-y divide-slate-100 pt-2">
              {data.upcoming_events.length ? (
                data.upcoming_events.map((e) => (
                  <div key={e.id} className="flex items-center gap-4 py-3">
                    <DateTile iso={e.starts_at} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{e.title}</p>
                      <p className="text-xs text-slate-500">
                        {formatTimeRange(e.starts_at, e.ends_at)} · {e.venue} · {e.registrations_count ?? 0} registered
                      </p>
                    </div>
                    <Badge tone={eventStatus[e.display_status].tone}>{eventStatus[e.display_status].label}</Badge>
                  </div>
                ))
              ) : (
                <EmptyState title="Nothing scheduled" description="Consider reaching out to the officers." />
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <OfficersCard organizationId={org.id} officers={officers} />
          <Card>
            <CardHeader title="About" />
            <CardBody>
              <p className="text-sm whitespace-pre-line text-slate-600">{org.about || org.description}</p>
              {org.contact_email && (
                <a href={`mailto:${org.contact_email}`} className="mt-3 inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <Mail className="size-4" /> {org.contact_email}
                </a>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        title="Recognition status"
        description="Officers are notified of the change."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setStatusOpen(false)}>
              Cancel
            </Button>
            <Button loading={updateStatus.isPending} onClick={() => updateStatus.mutate()}>
              Update status
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Status">
            {(fid) => (
              <Select id={fid} value={statusForm.status} onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}>
                <option value="active">Good standing</option>
                <option value="probation">Probation</option>
                <option value="inactive">Inactive (hidden from students)</option>
              </Select>
            )}
          </Field>
          <Field label="Message to officers">
            {(fid) => <Textarea id={fid} rows={3} value={statusForm.note} onChange={(e) => setStatusForm({ ...statusForm, note: e.target.value })} />}
          </Field>
        </div>
      </Modal>
    </>
  )
}
