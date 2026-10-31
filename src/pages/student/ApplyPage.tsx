import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Info, Send } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage, getFieldErrors } from '@/api/client'
import { studentApi } from '@/api/student'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { Alert, ErrorState, PageLoader } from '@/components/ui/Feedback'
import { Checkbox, Field, Input, Textarea } from '@/components/ui/Field'
import { Detail, OrgMark, PageHeader } from '@/components/ui/Misc'
import { useAuth } from '@/context/AuthContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function ApplyPage() {
  const { slug = '' } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['student', 'organization', slug], queryFn: () => studentApi.organization(slug) })
  useDocumentTitle(data ? `Apply to ${data.organization.acronym}` : 'Apply')

  const [form, setForm] = useState({ reason: '', experience: '', availability: '', answer: '', agreed: false })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const submit = useMutation({
    mutationFn: () => studentApi.apply(slug, form),
    onSuccess: (application) => {
      toast.success('Application submitted!')
      queryClient.invalidateQueries({ queryKey: ['student'] })
      navigate(`/applications/${application.id}`, { replace: true })
    },
    onError: (e) => {
      setErrors(getFieldErrors(e))
      toast.error(getErrorMessage(e))
    },
  })

  if (isLoading) return <PageLoader />
  if (error || !data) return <ErrorState error={error} onRetry={refetch} />

  const org = data.organization
  if (org.viewer?.membership) return <Navigate to={`/organizations/${slug}`} replace />
  if (org.viewer?.application?.status === 'pending') return <Navigate to={`/applications/${org.viewer.application.id}`} replace />

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    submit.mutate()
  }

  return (
    <>
      <nav className="mb-4 flex items-center gap-1 text-xs text-slate-500" aria-label="Breadcrumb">
        <Link to="/discover" className="hover:text-blue-600">Organizations</Link>
        <ChevronRight className="size-3.5" />
        <Link to={`/organizations/${slug}`} className="truncate hover:text-blue-600">{org.acronym}</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-slate-700">Apply</span>
      </nav>

      <PageHeader eyebrow="Membership application" title={`Join ${org.name}`} description="Officers will review your answers. Be honest — there are no wrong answers." />

      {!org.is_open_for_applications && (
        <Alert tone="warning" className="mb-6" title="Applications are closed">
          This organization is not accepting members right now. Save it to get notified when they open again.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={onSubmit} className="lg:col-span-2">
          <Card>
            <CardBody className="space-y-5">
              <Field label="Why would you like to join?" required error={errors.reason} hint={`${form.reason.length}/1500 · at least 20 characters`}>
                {(id) => (
                  <Textarea
                    id={id}
                    rows={5}
                    maxLength={1500}
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    placeholder="What do you hope to learn or contribute?"
                    invalid={!!errors.reason}
                  />
                )}
              </Field>

              {org.application_question && (
                <Field label={org.application_question} error={errors.answer}>
                  {(id) => <Textarea id={id} rows={3} maxLength={1500} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} />}
                </Field>
              )}

              <Field label="Relevant experience" hint="Optional — classes, projects, clubs or anything related." error={errors.experience}>
                {(id) => <Textarea id={id} rows={3} maxLength={1500} value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />}
              </Field>

              <Field label="Weekly availability" hint="e.g. Thursdays after 3:00 PM, Saturday mornings" error={errors.availability}>
                {(id) => <Input id={id} maxLength={255} value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} />}
              </Field>

              <div className="rounded-xl bg-slate-50 p-4">
                <Checkbox
                  checked={form.agreed}
                  onChange={(e) => setForm({ ...form, agreed: e.target.checked })}
                  label={`I agree to follow the ${org.acronym} constitution, the CPC Student Handbook and safety rules for organization activities.`}
                />
                {errors.agreed && <p className="mt-2 text-xs text-red-600">{errors.agreed}</p>}
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="secondary" to={`/organizations/${slug}`}>
                  Cancel
                </Button>
                <Button type="submit" loading={submit.isPending} disabled={!form.agreed || !org.is_open_for_applications} icon={<Send className="size-4" />}>
                  Submit application
                </Button>
              </div>
            </CardBody>
          </Card>
        </form>

        <div className="space-y-6">
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center gap-3">
                <OrgMark acronym={org.acronym} color={org.color} />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{org.name}</p>
                  <p className="text-xs text-slate-500">{org.members_count} members</p>
                </div>
              </div>
              <Detail label="Applying as">{user?.name}</Detail>
              <Detail label="Student ID">{user?.id_number}</Detail>
              <Detail label="Program">{user?.program_label}</Detail>
            </CardBody>
          </Card>
          <Alert tone="info" icon={<Info />} title="What happens next?">
            Your enrolled-student status is verified automatically. An officer reviews your application and you'll get a notification with the decision — usually within 5 school days.
          </Alert>
        </div>
      </div>
    </>
  )
}
