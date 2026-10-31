import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Lock, Save } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage, getFieldErrors } from '@/api/client'
import { officerApi, type OrganizationSettingsPayload } from '@/api/officer'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ErrorState, PageLoader } from '@/components/ui/Feedback'
import { Field, Input, Textarea, Toggle } from '@/components/ui/Field'
import { Detail, OrgMark, PageHeader } from '@/components/ui/Misc'
import { useAuth } from '@/context/AuthContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { orgStatus } from '@/lib/status'

const swatches = ['#2563eb', '#1e3a8a', '#7c3aed', '#db2777', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#475569']

export default function OrganizationSettingsPage() {
  useDocumentTitle('Organization settings')
  const { activeOrganization } = useAuth()
  const queryClient = useQueryClient()
  const { data: org, isLoading, error, refetch } = useQuery({ queryKey: ['officer', 'organization', activeOrganization?.id], queryFn: officerApi.organization })
  const [form, setForm] = useState<OrganizationSettingsPayload | null>(null)
  const [tagsText, setTagsText] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!org) return
    setForm({
      tagline: org.tagline,
      description: org.description,
      about: org.about,
      color: org.color,
      contact_email: org.contact_email,
      facebook_url: org.facebook_url,
      meeting_schedule: org.meeting_schedule,
      tags: org.tags,
      accepting_members: org.accepting_members,
      capacity: org.capacity,
      application_deadline: org.application_deadline,
      application_question: org.application_question,
    })
    setTagsText(org.tags.join(', '))
  }, [org])

  const save = useMutation({
    mutationFn: () =>
      officerApi.updateOrganization({
        ...form!,
        tags: tagsText.split(',').map((t) => t.trim()).filter(Boolean),
        facebook_url: form!.facebook_url || null,
        contact_email: form!.contact_email || null,
        application_deadline: form!.application_deadline || null,
      }),
    onSuccess: () => {
      toast.success('Organization profile saved.')
      setErrors({})
      queryClient.invalidateQueries({ queryKey: ['officer'] })
    },
    onError: (e) => {
      setErrors(getFieldErrors(e))
      toast.error(getErrorMessage(e))
    },
  })

  if (isLoading || (!form && !error)) return <PageLoader />
  if (error || !org || !form) return <ErrorState error={error} onRetry={refetch} />

  const set = <K extends keyof OrganizationSettingsPayload>(key: K, value: OrganizationSettingsPayload[K]) => setForm((f) => (f ? { ...f, [key]: value } : f))
  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    save.mutate()
  }

  return (
    <>
      <PageHeader
        eyebrow={org.name}
        title="Organization profile"
        description="This is what students see on the Discover page and your organization page."
        actions={
          <Button variant="secondary" to={`/organizations/${org.slug}`} icon={<ExternalLink className="size-4" />}>
            Preview public page
          </Button>
        }
      />

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Public profile" />
            <CardBody className="space-y-4">
              <Field label="Tagline" error={errors.tagline}>
                {(id) => <Input id={id} value={form.tagline ?? ''} maxLength={160} onChange={(e) => set('tagline', e.target.value)} placeholder="One short line about your organization" />}
              </Field>
              <Field label="Short description" required error={errors.description} hint="Shown on the directory card (max 400 characters).">
                {(id) => <Textarea id={id} rows={2} value={form.description} maxLength={400} onChange={(e) => set('description', e.target.value)} />}
              </Field>
              <Field label="About" error={errors.about}>
                {(id) => <Textarea id={id} rows={6} value={form.about ?? ''} maxLength={3000} onChange={(e) => set('about', e.target.value)} />}
              </Field>
              <Field label="Tags" hint="Comma-separated, e.g. Web development, Peer mentoring" error={errors.tags}>
                {(id) => <Input id={id} value={tagsText} onChange={(e) => setTagsText(e.target.value)} />}
              </Field>
              <Field label="Color">
                {() => (
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
                )}
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Contact" />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Field label="Contact email" error={errors.contact_email}>
                {(id) => <Input id={id} type="email" value={form.contact_email ?? ''} onChange={(e) => set('contact_email', e.target.value)} />}
              </Field>
              <Field label="Facebook page URL" error={errors.facebook_url}>
                {(id) => <Input id={id} type="url" value={form.facebook_url ?? ''} onChange={(e) => set('facebook_url', e.target.value)} placeholder="https://facebook.com/..." />}
              </Field>
              <Field label="Meeting schedule" className="sm:col-span-2" error={errors.meeting_schedule}>
                {(id) => <Input id={id} value={form.meeting_schedule ?? ''} maxLength={160} onChange={(e) => set('meeting_schedule', e.target.value)} placeholder="Thursdays, 3:00 PM · Room 301" />}
              </Field>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Membership" />
            <CardBody className="space-y-5">
              {org.requires_all_students ? (
                <p className="text-sm text-slate-600">All enrolled students are automatically members of this organization.</p>
              ) : (
                <>
                  <Toggle checked={form.accepting_members} onChange={(v) => set('accepting_members', v)} label="Accepting new members" description="Turn off to hide the Join button." />
                  <Field label="Member capacity" hint={`${org.members_count ?? 0} current members. Blank = no limit.`} error={errors.capacity}>
                    {(id) => <Input id={id} type="number" min={1} value={form.capacity ?? ''} onChange={(e) => set('capacity', e.target.value ? Number(e.target.value) : null)} />}
                  </Field>
                  <Field label="Application deadline" error={errors.application_deadline}>
                    {(id) => <Input id={id} type="date" value={form.application_deadline ?? ''} onChange={(e) => set('application_deadline', e.target.value)} />}
                  </Field>
                  <Field label="Extra application question" hint="Optional question shown on the application form." error={errors.application_question}>
                    {(id) => <Input id={id} value={form.application_question ?? ''} maxLength={255} onChange={(e) => set('application_question', e.target.value)} />}
                  </Field>
                </>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Managed by the OSA" subtitle="Contact the Office of Student Affairs to change these" />
            <CardBody className="space-y-3">
              <div className="flex items-center gap-3">
                <OrgMark acronym={org.acronym} color={form.color} />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{org.name}</p>
                  <p className="text-xs text-slate-500">{org.acronym} · {org.category}</p>
                </div>
              </div>
              <Detail icon={<Lock />} label="Recognition status">
                <Badge tone={orgStatus[org.status].tone}>{orgStatus[org.status].label}</Badge>
              </Detail>
              {org.adviser_name && <Detail icon={<Lock />} label="Faculty adviser">{org.adviser_name}</Detail>}
            </CardBody>
          </Card>

          <Button type="submit" size="lg" className="w-full" loading={save.isPending} icon={<Save className="size-4" />}>
            Save changes
          </Button>
        </div>
      </form>
    </>
  )
}
