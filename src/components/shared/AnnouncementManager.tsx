import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Megaphone, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api/client'
import type { AnnouncementPayload } from '@/api/officer'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/Feedback'
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/Misc'
import { Modal } from '@/components/ui/Modal'
import type { Announcement } from '@/types'
import { AnnouncementCard } from './AnnouncementCard'

interface AnnouncementManagerProps {
  queryKey: unknown[]
  eyebrow: string
  description: string
  /** Officers can choose members-only; OSA posts are always campus-wide. */
  allowAudience: boolean
  load: () => Promise<Announcement[]>
  create: (payload: AnnouncementPayload) => Promise<Announcement>
  update: (id: number, payload: AnnouncementPayload) => Promise<Announcement>
  remove: (id: number) => Promise<unknown>
}

const empty: AnnouncementPayload = { title: '', body: '', audience: 'members', is_pinned: false, notify: true }

/** Create / edit / delete announcements (shared by officers and the OSA). */
export function AnnouncementManager({ queryKey, eyebrow, description, allowAudience, load, create, update, remove }: AnnouncementManagerProps) {
  const queryClient = useQueryClient()
  const { data, isLoading, error, refetch } = useQuery({ queryKey, queryFn: load })
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<AnnouncementPayload>(empty)

  const startCreate = () => {
    setEditing(null)
    setForm({ ...empty, audience: allowAudience ? 'members' : 'all' })
    setOpen(true)
  }

  const startEdit = (a: Announcement) => {
    setEditing(a)
    setForm({ title: a.title, body: a.body, audience: a.audience, is_pinned: a.is_pinned })
    setOpen(true)
  }

  const save = useMutation({
    mutationFn: () => (editing ? update(editing.id, form) : create(form)),
    onSuccess: () => {
      toast.success(editing ? 'Announcement updated.' : 'Announcement posted.')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const del = useMutation({
    mutationFn: (id: number) => remove(id),
    onSuccess: () => {
      toast.success('Announcement deleted.')
      queryClient.invalidateQueries({ queryKey })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title="Announcements"
        description={description}
        actions={
          <Button icon={<Plus className="size-4" />} onClick={startCreate}>
            New announcement
          </Button>
        }
      />

      {isLoading ? (
        <PageLoader />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : data?.length ? (
        <div className="space-y-3">
          {data.map((a) => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              actions={
                <>
                  <Button size="sm" variant="secondary" icon={<Pencil className="size-3.5" />} onClick={() => startEdit(a)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    icon={<Trash2 className="size-3.5" />}
                    loading={del.isPending && del.variables === a.id}
                    onClick={() => window.confirm('Delete this announcement?') && del.mutate(a.id)}
                  >
                    Delete
                  </Button>
                </>
              }
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white">
          <EmptyState icon={<Megaphone />} title="No announcements yet" description="Post schedules, reminders and updates so students don't have to rely on group chats." action={<Button onClick={startCreate}>Post the first one</Button>} />
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit announcement' : 'New announcement'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button loading={save.isPending} disabled={!form.title.trim() || !form.body.trim()} onClick={() => save.mutate()}>
              {editing ? 'Save changes' : 'Post announcement'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title" required>
            {(id) => <Input id={id} value={form.title} maxLength={150} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Hackathon registration is open" />}
          </Field>
          <Field label="Message" required>
            {(id) => <Textarea id={id} rows={6} value={form.body} maxLength={5000} onChange={(e) => setForm({ ...form, body: e.target.value })} />}
          </Field>
          {allowAudience && (
            <Field label="Who can see this?">
              {(id) => (
                <Select id={id} value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value as 'all' | 'members' })}>
                  <option value="members">Members only</option>
                  <option value="all">All students (public)</option>
                </Select>
              )}
            </Field>
          )}
          <Checkbox label="Pin to the top" checked={form.is_pinned} onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })} />
          {!editing && (
            <Checkbox
              label="Send a notification"
              description={allowAudience ? 'Members get an in-app notification.' : 'Every student gets an in-app notification.'}
              checked={form.notify ?? true}
              onChange={(e) => setForm({ ...form, notify: e.target.checked })}
            />
          )}
        </div>
      </Modal>
    </>
  )
}
