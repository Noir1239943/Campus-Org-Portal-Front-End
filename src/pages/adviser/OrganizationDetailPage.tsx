import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, CalendarCheck2, CalendarDays, ChevronRight, Mail, Pencil, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { adviserApi } from '@/api/adviser'
import { getErrorMessage } from '@/api/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Alert, EmptyState, ErrorState, PageLoader } from '@/components/ui/Feedback'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { OfficersCard } from '@/components/shared/OfficersCard'
import { DateTile, OrgMark, PageHeader } from '@/components/ui/Misc'
import { Modal } from '@/components/ui/Modal'
import { StatCard } from '@/components/ui/StatCard'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatTimeRange, percent } from '@/lib/format'
import { eventStatus, healthStatus, orgStatus } from '@/lib/status'

export default function AdviserOrganizationDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [statusOpen, setStatusOpen] = useState(false)
  const [statusForm, setStatusForm] = useState({ status: 'active', note: '' })
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
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

  const setStatus = useMutation({
    mutationFn: ({ status }: { status: string; message: string }) => adviserApi.updateOrganizationStatus(Number(id), { status }),
    onSuccess: (_, { message }) => {
      toast.success(message)
      queryClient.invalidateQueries({ queryKey: ['adviser'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const remove = useMutation({
    mutationFn: () => adviserApi.deleteOrganization(Number(id), confirmText.trim()),
    onSuccess: (res) => {
      toast.success(res.message)
      setDeleteOpen(false)
      queryClient.invalidateQueries({ queryKey: ['adviser'] })
      navigate('/adviser/organizations')
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

          <Card className="border-red-200">
            <CardHeader title="Danger zone" subtitle="Only the OSA can do this" />
            <CardBody className="space-y-4">
              {org.status === 'inactive' ? (
                <Alert
                  tone="warning"
                  icon={<Archive />}
                  title="Archived"
                  action={
                    <Button size="sm" variant="secondary" loading={setStatus.isPending} onClick={() => setStatus.mutate({ status: 'active', message: `${org.name} was restored.` })}>
                      Restore
                    </Button>
                  }
                >
                  Hidden from students and officers. All history is kept.
                </Alert>
              ) : (
                <div>
                  <Button
                    variant="danger"
                    icon={<Archive className="size-4" />}
                    loading={setStatus.isPending}
                    onClick={() =>
                      window.confirm(`Archive ${org.name}? It will be hidden from students and officers. History is kept and you can restore it any time.`) &&
                      setStatus.mutate({ status: 'inactive', message: `${org.name} was archived.` })
                    }
                  >
                    Archive organization
                  </Button>
                  <p className="mt-2 text-xs text-slate-500">Hidden from students and officers. Members, events and attendance are kept for reports, and you can restore it later.</p>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4">
                <Button variant="danger" icon={<Trash2 className="size-4" />} disabled={!data.can_delete} onClick={() => setDeleteOpen(true)}>
                  Delete permanently
                </Button>
                <p className="mt-2 text-xs text-slate-500">
                  {data.can_delete
                    ? 'Only possible because this organization was never used. This cannot be undone.'
                    : `Has ${data.history.events} ${data.history.events === 1 ? 'event' : 'events'} and ${data.history.attendance} attendance ${data.history.attendance === 1 ? 'record' : 'records'} — archive instead.`}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this organization permanently?"
        description={`${org.name} and its members, applications and announcements will be removed. Members are notified.`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              loading={remove.isPending}
              disabled={confirmText.trim().toLowerCase() !== org.acronym.toLowerCase()}
              onClick={() => remove.mutate()}
            >
              Delete permanently
            </Button>
          </>
        }
      >
        <Field label={`Type ${org.acronym} to confirm`} required>
          {(fid) => <Input id={fid} value={confirmText} autoComplete="off" onChange={(e) => setConfirmText(e.target.value)} />}
        </Field>
      </Modal>

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
                <option value="inactive">Archived (hidden from students, history kept)</option>
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
