import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Save } from 'lucide-react'
import { toast } from 'sonner'
import { adviserApi, type OrganizationFormPayload } from '@/api/adviser'
import { getErrorMessage, getFieldErrors } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ErrorState, PageLoader } from '@/components/ui/Feedback'
import { Field, Input, Select, Textarea, Toggle } from '@/components/ui/Field'
import { OrgMark, PageHeader } from '@/components/ui/Misc'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { organizationCategories } from '@/lib/status'

const swatches = ['#2563eb', '#1e3a8a', '#7c3aed', '#db2777', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#475569']

const emptyForm: OrganizationFormPayload = {
  name: '',
  acronym: '',
  category: organizationCategories[0],
  tagline: null,
  description: '',
  about: null,
  color: swatches[0],
  adviser_name: null,
  contact_email: null,
  meeting_schedule: null,
  accepting_members: true,
  requires_all_students: false,
  capacity: null,
  president: '',
}

export default function OrganizationFormPage() {
  const { id } = useParams()
  const editing = !!id
  useDocumentTitle(editing ? 'Edit organization' : 'Create organization')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<OrganizationFormPayload | null>(editing ? null : emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adviser', 'organization', id],
    queryFn: () => adviserApi.organization(id!),
    enabled: editing,
  })

  useEffect(() => {
    if (!data) return
    const org = data.organization
    setForm({
      name: org.name,
      acronym: org.acronym,
      category: org.category,
      tagline: org.tagline,
      description: org.description,
      about: org.about,
      color: org.color,
      adviser_name: org.adviser_name,
      contact_email: org.contact_email,
      meeting_schedule: org.meeting_schedule,
      accepting_members: org.accepting_members,
      requires_all_students: org.requires_all_students,
      capacity: org.capacity,
    })
  }, [data])

  const save = useMutation({
    mutationFn: async () => {
      const payload: OrganizationFormPayload = {
        ...form!,
        acronym: form!.acronym.trim().toUpperCase(),
        tagline: form!.tagline || null,
        about: form!.about || null,
        adviser_name: form!.adviser_name || null,
        contact_email: form!.contact_email || null,
        meeting_schedule: form!.meeting_schedule || null,
      }

      if (editing) {
        delete payload.president
        const org = await adviserApi.updateOrganization(Number(id), payload)
        return { id: org.id, message: 'Organization updated.' }
      }

      payload.president = form!.president?.trim() || undefined
      const res = await adviserApi.createOrganization(payload)
      return { id: res.organization.id, message: res.message }
    },
    onSuccess: (res) => {
      toast.success(res.message)
      queryClient.invalidateQueries({ queryKey: ['adviser'] })
      navigate(`/adviser/organizations/${res.id}`)
    },
    onError: (e) => {
      setErrors(getFieldErrors(e))
      toast.error(getErrorMessage(e))
    },
  })

  if (editing && isLoading) return <PageLoader />
  if (editing && (error || !data)) return <ErrorState error={error} onRetry={refetch} />
  if (!form) return <PageLoader />

  const set = <K extends keyof OrganizationFormPayload>(key: K, value: OrganizationFormPayload[K]) => setForm((f) => (f ? { ...f, [key]: value } : f))
  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setErrors({})
    save.mutate()
  }

  return (
    <>
      <nav className="mb-4 flex items-center gap-1 text-xs text-slate-500" aria-label="Breadcrumb">
        <Link to="/adviser/organizations" className="hover:text-blue-600">Organizations</Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-slate-700">{editing ? `Edit ${data?.organization.acronym}` : 'New organization'}</span>
      </nav>

      <PageHeader
        eyebrow="Student affairs"
        title={editing ? 'Edit organization details' : 'Create an organization'}
        description={editing ? 'Official details are managed by the OSA. Officers can still edit the public profile.' : 'Recognize a new organization and, optionally, name its first President.'}
      />

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Official details" />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Field label="Organization name" required error={errors.name} className="sm:col-span-2">
                {(fid) => <Input id={fid} value={form.name} maxLength={150} onChange={(e) => set('name', e.target.value)} invalid={!!errors.name} required />}
              </Field>
              <Field label="Acronym" required error={errors.acronym} hint="Letters, numbers, & or - (max 12).">
                {(fid) => <Input id={fid} value={form.acronym} maxLength={12} onChange={(e) => set('acronym', e.target.value.toUpperCase())} invalid={!!errors.acronym} required />}
              </Field>
              <Field label="Category" required error={errors.category}>
                {(fid) => (
                  <Select id={fid} value={form.category} onChange={(e) => set('category', e.target.value)}>
                    {organizationCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Faculty adviser" error={errors.adviser_name}>
                {(fid) => <Input id={fid} value={form.adviser_name ?? ''} maxLength={150} onChange={(e) => set('adviser_name', e.target.value)} placeholder="e.g. Mr. Juan Dela Cruz" />}
              </Field>
              <Field label="Contact email" error={errors.contact_email}>
                {(fid) => <Input id={fid} type="email" value={form.contact_email ?? ''} onChange={(e) => set('contact_email', e.target.value)} invalid={!!errors.contact_email} />}
              </Field>
              <Field label="Tagline" error={errors.tagline} className="sm:col-span-2">
                {(fid) => <Input id={fid} value={form.tagline ?? ''} maxLength={160} onChange={(e) => set('tagline', e.target.value)} placeholder="One short line about the organization" />}
              </Field>
              <Field label="Short description" required error={errors.description} hint="Shown on the directory card (max 400 characters)." className="sm:col-span-2">
                {(fid) => <Textarea id={fid} rows={3} value={form.description} maxLength={400} onChange={(e) => set('description', e.target.value)} invalid={!!errors.description} required />}
              </Field>
              <Field label="About" error={errors.about} className="sm:col-span-2">
                {(fid) => <Textarea id={fid} rows={5} value={form.about ?? ''} maxLength={3000} onChange={(e) => set('about', e.target.value)} />}
              </Field>
              <Field label="Meeting schedule" error={errors.meeting_schedule} className="sm:col-span-2">
                {(fid) => <Input id={fid} value={form.meeting_schedule ?? ''} maxLength={160} onChange={(e) => set('meeting_schedule', e.target.value)} placeholder="Thursdays, 3:00 PM · Room 301" />}
              </Field>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Look" />
            <CardBody className="space-y-4">
              <div className="flex items-center gap-3">
                <OrgMark acronym={form.acronym || 'ORG'} color={form.color} size="lg" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{form.name || 'Organization name'}</p>
                  <p className="text-xs text-slate-500">{form.category}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {swatches.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set('color', c)}
                    className="size-8 rounded-full ring-offset-2 transition"
                    style={{ backgroundColor: c, boxShadow: form.color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : undefined }}
                    aria-label={`Use color ${c}`}
                    aria-pressed={form.color === c}
                  />
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Membership" />
            <CardBody className="space-y-5">
              <Toggle checked={form.accepting_members} onChange={(v) => set('accepting_members', v)} label="Accepting new members" description="Turn off to hide the Join button." />
              <Toggle checked={form.requires_all_students} onChange={(v) => set('requires_all_students', v)} label="Every student is a member" description="For bodies like the student government." />
              <Field label="Member capacity" hint="Blank = no limit." error={errors.capacity}>
                {(fid) => <Input id={fid} type="number" min={1} value={form.capacity ?? ''} onChange={(e) => set('capacity', e.target.value ? Number(e.target.value) : null)} />}
              </Field>
            </CardBody>
          </Card>

          {!editing && (
            <Card>
              <CardHeader title="President" subtitle="Optional — you can assign one later" />
              <CardBody>
                <Field label="Student ID number or email" error={errors.president}>
                  {(fid) => <Input id={fid} value={form.president ?? ''} onChange={(e) => set('president', e.target.value)} placeholder="2025-00123" invalid={!!errors.president} />}
                </Field>
              </CardBody>
            </Card>
          )}

          <Button type="submit" size="lg" className="w-full" loading={save.isPending} icon={<Save className="size-4" />}>
            {editing ? 'Save changes' : 'Create organization'}
          </Button>
        </div>
      </form>
    </>
  )
}
