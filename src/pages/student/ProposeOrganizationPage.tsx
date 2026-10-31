import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ClipboardCheck, Crown, Lightbulb, Send } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage, getFieldErrors } from '@/api/client'
import { studentApi, type ProposalPayload } from '@/api/student'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/Misc'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { organizationCategories } from '@/lib/status'

const steps = [
  { icon: Send, title: 'Submit your proposal', text: 'Tell the OSA what the organization is for and what it plans to do.' },
  { icon: ClipboardCheck, title: 'The OSA reviews it', text: 'You will be notified when it is approved or sent back with a note.' },
  { icon: Crown, title: 'You become President', text: 'Once approved, the organization is created and you get officer access to set it up.' },
]

const emptyForm: ProposalPayload = {
  name: '',
  acronym: '',
  category: organizationCategories[0],
  description: '',
  purpose: '',
  planned_activities: null,
  adviser_name: null,
  expected_members: null,
}

export default function ProposeOrganizationPage() {
  useDocumentTitle('Start an organization')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ProposalPayload>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const submit = useMutation({
    mutationFn: () =>
      studentApi.propose({
        ...form,
        acronym: form.acronym.trim().toUpperCase(),
        planned_activities: form.planned_activities || null,
        adviser_name: form.adviser_name || null,
      }),
    onSuccess: () => {
      toast.success('Proposal submitted. The OSA has been notified.')
      queryClient.invalidateQueries({ queryKey: ['student', 'proposals'] })
      navigate('/applications?tab=proposals')
    },
    onError: (e) => {
      setErrors(getFieldErrors(e))
      toast.error(getErrorMessage(e))
    },
  })

  const set = <K extends keyof ProposalPayload>(key: K, value: ProposalPayload[K]) => setForm((f) => ({ ...f, [key]: value }))
  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setErrors({})
    submit.mutate()
  }

  return (
    <>
      <PageHeader
        eyebrow="New organization"
        title="Start an organization"
        description="Can't find a group that fits you? Propose a new one. The Office of Student Affairs will review it."
      />

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="About the organization" />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Field label="Organization name" required error={errors.name} className="sm:col-span-2">
                {(id) => <Input id={id} value={form.name} maxLength={150} onChange={(e) => set('name', e.target.value)} invalid={!!errors.name} required />}
              </Field>
              <Field label="Acronym" required error={errors.acronym} hint="Letters, numbers, & or - (max 12).">
                {(id) => <Input id={id} value={form.acronym} maxLength={12} onChange={(e) => set('acronym', e.target.value.toUpperCase())} invalid={!!errors.acronym} required />}
              </Field>
              <Field label="Category" required error={errors.category}>
                {(id) => (
                  <Select id={id} value={form.category} onChange={(e) => set('category', e.target.value)}>
                    {organizationCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Short description" required error={errors.description} hint="One or two sentences shown on the directory (20–400 characters)." className="sm:col-span-2">
                {(id) => <Textarea id={id} rows={3} value={form.description} maxLength={400} onChange={(e) => set('description', e.target.value)} invalid={!!errors.description} required />}
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Why it is needed" />
            <CardBody className="space-y-4">
              <Field label="Purpose" required error={errors.purpose} hint="Why should this organization exist at CPC? (at least 30 characters)">
                {(id) => <Textarea id={id} rows={4} value={form.purpose} maxLength={2000} onChange={(e) => set('purpose', e.target.value)} invalid={!!errors.purpose} required />}
              </Field>
              <Field label="Planned activities" error={errors.planned_activities} hint="Optional — events or programs you would run in your first semester.">
                {(id) => <Textarea id={id} rows={4} value={form.planned_activities ?? ''} maxLength={2000} onChange={(e) => set('planned_activities', e.target.value)} />}
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Proposed faculty adviser" error={errors.adviser_name} hint="Optional">
                  {(id) => <Input id={id} value={form.adviser_name ?? ''} maxLength={150} onChange={(e) => set('adviser_name', e.target.value)} />}
                </Field>
                <Field label="Expected members" error={errors.expected_members} hint="Optional">
                  {(id) => <Input id={id} type="number" min={1} value={form.expected_members ?? ''} onChange={(e) => set('expected_members', e.target.value ? Number(e.target.value) : null)} />}
                </Field>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="How it works" />
            <CardBody>
              <ol className="space-y-4">
                {steps.map(({ icon: Icon, title, text }, i) => (
                  <li key={title} className="flex gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                      <Icon className="size-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">
                        {i + 1}. {title}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">{text}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>

          <Button type="submit" size="lg" className="w-full" loading={submit.isPending} icon={<Lightbulb className="size-4" />}>
            Submit proposal
          </Button>
        </div>
      </form>
    </>
  )
}
