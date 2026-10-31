import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Info, Save, Send } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage, getFieldErrors } from '@/api/client'
import { officerApi, type EventPayload } from '@/api/officer'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Alert, ErrorState, PageLoader } from '@/components/ui/Feedback'
import { Field, Input, Select, Textarea, Toggle } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/Misc'
import { useAuth } from '@/context/AuthContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { combineDateTime, toDateInput, toTimeInput } from '@/lib/format'
import { eventTypes } from '@/lib/status'

const venues = ['Multipurpose Hall', 'AVR', 'Covered Court', 'Computer Laboratory 1', 'Computer Laboratory 2', 'Library', 'HM Laboratory', 'Room 105', 'Room 110', 'Room 204', 'Room 301']

interface FormState {
  title: string
  type: string
  description: string
  venue: string
  date: string
  start: string
  end: string
  capacity: string
  visibility: 'open' | 'members'
  is_mandatory: boolean
  service_hours: string
  speaker: string
}

const initial: FormState = {
  title: '',
  type: 'Seminar',
  description: '',
  venue: '',
  date: '',
  start: '14:00',
  end: '16:00',
  capacity: '',
  visibility: 'open',
  is_mandatory: false,
  service_hours: '0',
  speaker: '',
}

export default function EventFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  useDocumentTitle(isEdit ? 'Edit event' : 'Create event')
  const { activeOrganization, campus } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['officer', 'event', id],
    queryFn: () => officerApi.event(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (!event) return
    setForm({
      title: event.title,
      type: event.type,
      description: event.description ?? '',
      venue: event.venue,
      date: toDateInput(event.starts_at),
      start: toTimeInput(event.starts_at),
      end: toTimeInput(event.ends_at),
      capacity: event.capacity ? String(event.capacity) : '',
      visibility: event.visibility,
      is_mandatory: event.is_mandatory,
      service_hours: String(event.service_hours ?? 0),
      speaker: event.speaker ?? '',
    })
  }, [event])

  const save = useMutation({
    mutationFn: (action: 'draft' | 'submit') => {
      const payload: EventPayload = {
        title: form.title,
        type: form.type,
        description: form.description,
        venue: form.venue,
        starts_at: combineDateTime(form.date, form.start),
        ends_at: combineDateTime(form.date, form.end),
        capacity: form.capacity ? Number(form.capacity) : null,
        visibility: form.visibility,
        is_mandatory: form.is_mandatory,
        service_hours: Number(form.service_hours) || 0,
        speaker: form.speaker,
        action,
      }
      return isEdit ? officerApi.updateEvent(Number(id), payload) : officerApi.createEvent(payload)
    },
    onSuccess: (saved) => {
      const message =
        saved.status === 'pending' ? 'Sent to the OSA for approval.' : saved.status === 'published' ? 'Event saved and published.' : 'Draft saved.'
      toast.success(message)
      queryClient.invalidateQueries({ queryKey: ['officer'] })
      navigate('/officer/events')
    },
    onError: (e) => {
      setErrors(getFieldErrors(e))
      toast.error(getErrorMessage(e))
    },
  })

  if (isEdit && isLoading) return <PageLoader />
  if (isEdit && error) return <ErrorState error={error} />

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))
  const isPublished = event?.status === 'published'
  const valid = form.title.trim() && form.venue.trim() && form.date && form.start && form.end

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    save.mutate(isPublished ? 'draft' : 'submit')
  }

  return (
    <>
      <nav className="mb-4 flex items-center gap-1 text-xs text-slate-500" aria-label="Breadcrumb">
        <Link to="/officer/events" className="hover:text-blue-600">Events</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-slate-700">{isEdit ? 'Edit' : 'New event'}</span>
      </nav>

      <PageHeader
        eyebrow={activeOrganization?.name}
        title={isEdit ? `Edit "${event?.title ?? ''}"` : 'Create an event'}
        description={campus?.require_event_approval && !isPublished ? 'Events are reviewed by the Office of Student Affairs before students can see them — this replaces the paper activity proposal.' : undefined}
      />

      {event?.status === 'rejected' && event.review_note && (
        <Alert tone="danger" className="mb-6" title="Returned by the OSA — please revise">
          {event.review_note}
        </Alert>
      )}

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Event details" />
            <CardBody className="space-y-4">
              <Field label="Title" required error={errors.title}>
                {(fid) => <Input id={fid} value={form.title} maxLength={150} onChange={(e) => set('title', e.target.value)} placeholder="e.g. IT Seminar: Responsible AI" invalid={!!errors.title} />}
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Type" required error={errors.type}>
                  {(fid) => (
                    <Select id={fid} value={form.type} onChange={(e) => set('type', e.target.value)}>
                      {eventTypes.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Speaker / facilitator" error={errors.speaker}>
                  {(fid) => <Input id={fid} value={form.speaker} maxLength={150} onChange={(e) => set('speaker', e.target.value)} placeholder="Optional" />}
                </Field>
              </div>
              <Field label="Description" error={errors.description} hint="What will students do or learn? What should they bring?">
                {(fid) => <Textarea id={fid} rows={5} maxLength={3000} value={form.description} onChange={(e) => set('description', e.target.value)} />}
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Schedule & venue" />
            <CardBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Date" required error={errors.starts_at}>
                  {(fid) => <Input id={fid} type="date" value={form.date} onChange={(e) => set('date', e.target.value)} invalid={!!errors.starts_at} />}
                </Field>
                <Field label="Starts" required>
                  {(fid) => <Input id={fid} type="time" value={form.start} onChange={(e) => set('start', e.target.value)} />}
                </Field>
                <Field label="Ends" required error={errors.ends_at}>
                  {(fid) => <Input id={fid} type="time" value={form.end} onChange={(e) => set('end', e.target.value)} invalid={!!errors.ends_at} />}
                </Field>
              </div>
              <Field label="Venue" required error={errors.venue}>
                {(fid) => (
                  <>
                    <Input id={fid} list="venue-options" value={form.venue} maxLength={150} onChange={(e) => set('venue', e.target.value)} placeholder="Choose or type a venue" invalid={!!errors.venue} />
                    <datalist id="venue-options">
                      {venues.map((v) => (
                        <option key={v} value={v} />
                      ))}
                    </datalist>
                  </>
                )}
              </Field>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Participation" />
            <CardBody className="space-y-5">
              <Field label="Who can join?">
                {(fid) => (
                  <Select id={fid} value={form.visibility} onChange={(e) => set('visibility', e.target.value as 'open' | 'members')}>
                    <option value="open">All CPC students</option>
                    <option value="members">{activeOrganization?.acronym} members only</option>
                  </Select>
                )}
              </Field>
              <Toggle
                checked={form.is_mandatory}
                onChange={(v) => set('is_mandatory', v)}
                label="Required for members"
                description="Members who miss it without an approved excuse are flagged for clearance."
              />
              <Field label="Capacity" hint="Leave blank for no limit" error={errors.capacity}>
                {(fid) => <Input id={fid} type="number" min={1} value={form.capacity} onChange={(e) => set('capacity', e.target.value)} />}
              </Field>
              <Field label="Community service hours" hint="Credited to students who check in" error={errors.service_hours}>
                {(fid) => <Input id={fid} type="number" min={0} max={24} step={0.5} value={form.service_hours} onChange={(e) => set('service_hours', e.target.value)} />}
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-2">
              {isPublished ? (
                <Button type="submit" className="w-full" loading={save.isPending} disabled={!valid} icon={<Save className="size-4" />}>
                  Save changes
                </Button>
              ) : (
                <>
                  <Button type="submit" className="w-full" loading={save.isPending && save.variables === 'submit'} disabled={!valid} icon={<Send className="size-4" />}>
                    {campus?.require_event_approval ? 'Submit for OSA approval' : 'Publish event'}
                  </Button>
                  <Button variant="secondary" className="w-full" loading={save.isPending && save.variables === 'draft'} disabled={!valid} icon={<Save className="size-4" />} onClick={() => save.mutate('draft')}>
                    Save as draft
                  </Button>
                </>
              )}
              {isPublished && (
                <p className="flex gap-2 pt-1 text-xs text-slate-500">
                  <Info className="size-4 shrink-0" />
                  Registered students are notified if you change the time or venue.
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </form>
    </>
  )
}
