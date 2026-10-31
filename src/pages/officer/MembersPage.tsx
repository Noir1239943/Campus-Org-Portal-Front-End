import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Pencil, Search, UserMinus, UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { downloadFile, getErrorMessage } from '@/api/client'
import { officerApi } from '@/api/officer'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState } from '@/components/ui/Feedback'
import { Checkbox, Field, Input } from '@/components/ui/Field'
import { Avatar, PageHeader, Pills } from '@/components/ui/Misc'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/context/AuthContext'
import { useDebounce } from '@/hooks/useDebounce'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/cn'
import { formatDate, percent } from '@/lib/format'
import type { MemberRow } from '@/types'

export default function MembersPage() {
  useDocumentTitle('Members')
  const { activeOrganization, user } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState<MemberRow | null>(null)
  const [editForm, setEditForm] = useState({ position: '', is_officer: false })
  const [adding, setAdding] = useState(false)
  const [addForm, setAddForm] = useState({ identifier: '', position: '' })
  const debounced = useDebounce(search)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['officer', 'members', activeOrganization?.id, debounced, filter],
    queryFn: () => officerApi.members({ search: debounced, filter }),
    placeholderData: (prev) => prev,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['officer'] })

  const update = useMutation({
    mutationFn: () => officerApi.updateMember(editing!.membership_id, editForm),
    onSuccess: () => {
      toast.success('Member updated.')
      setEditing(null)
      invalidate()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const remove = useMutation({
    mutationFn: (m: MemberRow) => officerApi.removeMember(m.membership_id),
    onSuccess: () => {
      toast.success('Member removed.')
      invalidate()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const add = useMutation({
    mutationFn: () => officerApi.addMember(addForm),
    onSuccess: (res) => {
      toast.success(res.message)
      setAdding(false)
      setAddForm({ identifier: '', position: '' })
      invalidate()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  return (
    <>
      <PageHeader
        eyebrow={activeOrganization?.name}
        title="Members"
        description="Your roster with each member's attendance at organization events. Members below 70% are flagged so you can reach out early."
        actions={
          <>
            <Button variant="secondary" icon={<Download className="size-4" />} onClick={() => downloadFile('/officer/members/export', 'members.csv').catch((e) => toast.error(getErrorMessage(e)))}>
              Export CSV
            </Button>
            <Button icon={<UserPlus className="size-4" />} onClick={() => setAdding(true)}>
              Add member
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Pills
          value={filter}
          onChange={setFilter}
          items={[
            { value: 'all', label: 'All', count: data?.counts.all },
            { value: 'officers', label: 'Officers', count: data?.counts.officers },
            { value: 'at_risk', label: 'At risk', count: data?.counts.at_risk },
          ]}
        />
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input type="search" className="pl-9" placeholder="Search name, ID or email" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search members" />
        </div>
      </div>

      <Card className="mt-4 overflow-hidden">
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isLoading ? (
          <div className="h-80 animate-pulse" />
        ) : data?.data.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50/80">
                <tr className="text-left text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  <th className="px-5 py-3">Member</th>
                  <th className="px-3 py-3">Position</th>
                  <th className="px-3 py-3">Joined</th>
                  <th className="px-3 py-3">Attendance</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-5 py-3 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((m) => (
                  <tr key={m.membership_id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar initials={m.user.initials} name={m.user.name} size="sm" />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800">{m.user.name}</p>
                          <p className="text-xs text-slate-500">
                            {m.user.id_number} · {m.user.program_label}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-slate-700">{m.position}</span>
                      {m.is_officer && <Badge tone="violet" className="ml-2">Officer</Badge>}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">{formatDate(m.joined_at)}</td>
                    <td className="px-3 py-3">
                      <span className={cn('font-semibold', m.status === 'at_risk' ? 'text-amber-600' : 'text-slate-800')}>{percent(m.attendance_rate)}</span>
                      <span className="ml-1 text-xs text-slate-400">
                        ({m.events_attended}/{m.events_expected})
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={m.status === 'at_risk' ? 'amber' : 'green'}>{m.status === 'at_risk' ? 'At risk' : 'Active'}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Edit ${m.user.name}`}
                          onClick={() => {
                            setEditing(m)
                            setEditForm({ position: m.position, is_officer: m.is_officer })
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        {m.user.id !== user?.id && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            aria-label={`Remove ${m.user.name}`}
                            onClick={() => window.confirm(`Remove ${m.user.name} from the organization?`) && remove.mutate(m)}
                          >
                            <UserMinus className="size-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<Users />} title="No members found" />
        )}
      </Card>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={`Edit ${editing?.user.name ?? 'member'}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button loading={update.isPending} disabled={!editForm.position.trim()} onClick={() => update.mutate()}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Position" hint="e.g. Member, Secretary, Events Committee">
            {(id) => <Input id={id} value={editForm.position} maxLength={60} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })} />}
          </Field>
          <Checkbox
            label="Officer access"
            description="Officers can review applications, manage events and take attendance."
            checked={editForm.is_officer}
            onChange={(e) => setEditForm({ ...editForm, is_officer: e.target.checked })}
          />
        </div>
      </Modal>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add a member"
        description="For students who signed up on paper or joined before the portal."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button loading={add.isPending} disabled={!addForm.identifier.trim()} onClick={() => add.mutate()}>
              Add member
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="School ID number or email" required>
            {(id) => <Input id={id} value={addForm.identifier} placeholder="2025-00123" onChange={(e) => setAddForm({ ...addForm, identifier: e.target.value })} />}
          </Field>
          <Field label="Position" hint="Leave blank for Member">
            {(id) => <Input id={id} value={addForm.position} maxLength={60} onChange={(e) => setAddForm({ ...addForm, position: e.target.value })} />}
          </Field>
        </div>
      </Modal>
    </>
  )
}
