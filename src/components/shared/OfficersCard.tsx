import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Crown, Mail, Pencil, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { adviserApi } from '@/api/adviser'
import { getErrorMessage, getFieldErrors } from '@/api/client'
import { Alert } from '@/components/ui/Feedback'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { Avatar } from '@/components/ui/Misc'
import { Modal } from '@/components/ui/Modal'
import { officerPositions } from '@/lib/status'
import type { OfficerRow } from '@/types'

const isPresident = (position: string) => position.trim().toLowerCase() === 'president'

/** OSA view of an organization's officers: assign, change position, remove officer access. */
export function OfficersCard({ organizationId, officers }: { organizationId: number; officers: OfficerRow[] }) {
  const queryClient = useQueryClient()
  const [assigning, setAssigning] = useState(false)
  const [assignForm, setAssignForm] = useState({ identifier: '', position: 'Officer' })
  const [assignError, setAssignError] = useState('')
  const [editing, setEditing] = useState<OfficerRow | null>(null)
  const [position, setPosition] = useState('')

  const currentPresident = officers.find((o) => o.is_president)
  const done = (message: string) => {
    toast.success(message)
    queryClient.invalidateQueries({ queryKey: ['adviser'] })
  }

  const assign = useMutation({
    mutationFn: () => adviserApi.addOfficer(organizationId, { identifier: assignForm.identifier.trim(), position: assignForm.position.trim() }),
    onSuccess: (res) => {
      done(res.message)
      setAssigning(false)
      setAssignForm({ identifier: '', position: 'Officer' })
      setAssignError('')
    },
    onError: (e) => setAssignError(getFieldErrors(e).identifier ?? getErrorMessage(e)),
  })

  const update = useMutation({
    mutationFn: (payload: { position: string; is_officer: boolean }) => adviserApi.updateOfficer(organizationId, editing!.membership_id, payload),
    onSuccess: (res) => {
      done(res.message)
      setEditing(null)
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const replacesPresident = isPresident(assignForm.position) && !!currentPresident
  const editReplacesPresident = !!editing && !editing.is_president && isPresident(position) && !!currentPresident

  return (
    <>
      <Card>
        <CardHeader
          title="Officers"
          action={
            <Button size="sm" variant="secondary" icon={<UserPlus className="size-4" />} onClick={() => setAssigning(true)}>
              Assign
            </Button>
          }
        />
        <CardBody className="space-y-3">
          {!currentPresident && (
            <Alert tone="warning" title="No President assigned">
              This organization has no President yet. Assign one so officers can be managed.
            </Alert>
          )}

          {officers.length ? (
            officers.map((o) => (
              <div key={o.membership_id} className="flex items-center gap-3">
                <Avatar initials={o.initials} name={o.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium text-slate-800">
                    {o.name}
                    {o.is_president && <Crown className="size-3.5 shrink-0 text-amber-500" aria-label="President" />}
                  </p>
                  <p className="text-xs text-slate-500">
                    {o.position} · {o.id_number}
                  </p>
                </div>
                <a href={`mailto:${o.email}`} className="text-slate-400 hover:text-blue-600" aria-label={`Email ${o.name}`}>
                  <Mail className="size-4" />
                </a>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Edit ${o.name}`}
                  onClick={() => {
                    setEditing(o)
                    setPosition(o.position)
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No officers assigned.</p>
          )}
        </CardBody>
      </Card>

      <Modal
        open={assigning}
        onClose={() => setAssigning(false)}
        title="Assign an officer"
        description="The student gets officer access and is notified."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAssigning(false)}>
              Cancel
            </Button>
            <Button loading={assign.isPending} disabled={!assignForm.identifier.trim() || !assignForm.position.trim()} onClick={() => assign.mutate()}>
              Assign
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Student ID number or email" required error={assignError}>
            {(id) => <Input id={id} value={assignForm.identifier} placeholder="2025-00123" onChange={(e) => setAssignForm({ ...assignForm, identifier: e.target.value })} invalid={!!assignError} />}
          </Field>
          <Field label="Position" required>
            {(id) => (
              <>
                <Input id={id} list="officer-positions" value={assignForm.position} maxLength={60} onChange={(e) => setAssignForm({ ...assignForm, position: e.target.value })} />
                <datalist id="officer-positions">
                  {officerPositions.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </>
            )}
          </Field>
          {replacesPresident && (
            <Alert tone="warning">
              This replaces the current President, {currentPresident?.name}, who goes back to being a regular member.
            </Alert>
          )}
        </div>
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={`Edit ${editing?.name ?? 'officer'}`}
        size="sm"
        footer={
          <>
            {editing && !editing.is_president ? (
              <Button
                variant="ghost"
                className="mr-auto text-red-600 hover:bg-red-50"
                loading={update.isPending}
                onClick={() => update.mutate({ position: 'Member', is_officer: false })}
              >
                Remove officer access
              </Button>
            ) : null}
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button loading={update.isPending} disabled={!position.trim()} onClick={() => update.mutate({ position: position.trim(), is_officer: true })}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Position" hint={editing?.is_president ? 'To replace the President, assign someone else as President.' : 'They stay a member if you remove officer access.'}>
            {(id) => (
              <>
                <Input id={id} list="officer-positions-edit" value={position} maxLength={60} disabled={editing?.is_president} onChange={(e) => setPosition(e.target.value)} />
                <datalist id="officer-positions-edit">
                  {officerPositions.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </>
            )}
          </Field>
          {editReplacesPresident && (
            <Alert tone="warning">
              This replaces the current President, {currentPresident?.name}, who goes back to being a regular member.
            </Alert>
          )}
        </div>
      </Modal>
    </>
  )
}
