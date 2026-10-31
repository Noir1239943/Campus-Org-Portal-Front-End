import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage, getFieldErrors } from '@/api/client'
import { studentApi } from '@/api/student'
import { Button } from '@/components/ui/Button'
import { Field, Select, Textarea } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { formatDateTime } from '@/lib/format'
import { excuseReasons } from '@/lib/status'

interface ExcuseModalProps {
  open: boolean
  onClose: () => void
  event: { id: number; title: string; starts_at: string } | null
}

/** File an excuse so a missed required event doesn't block clearance. */
export function ExcuseModal({ open, onClose, event }: ExcuseModalProps) {
  const queryClient = useQueryClient()
  const [reason, setReason] = useState('illness')
  const [details, setDetails] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const mutation = useMutation({
    mutationFn: () => studentApi.fileExcuse(event!.id, { reason, details }),
    onSuccess: () => {
      toast.success('Excuse sent. The officers will review it.')
      queryClient.invalidateQueries({ queryKey: ['student'] })
      setDetails('')
      setErrors({})
      onClose()
    },
    onError: (error) => {
      setErrors(getFieldErrors(error))
      toast.error(getErrorMessage(error))
    },
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="File an excuse"
      description={event ? `${event.title} · ${formatDateTime(event.starts_at)}` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={mutation.isPending} onClick={() => mutation.mutate()} disabled={!details.trim()}>
            Send excuse
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Reason" required error={errors.reason}>
          {(id) => (
            <Select id={id} value={reason} onChange={(e) => setReason(e.target.value)}>
              {excuseReasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field
          label="Explain briefly"
          required
          error={errors.details}
          hint="Be specific. If you have proof (medical slip, exam schedule), mention it — officers may ask to see it."
        >
          {(id) => (
            <Textarea
              id={id}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. Our lab exam was moved to the same afternoon by our instructor."
              maxLength={1000}
              invalid={!!errors.details}
            />
          )}
        </Field>
      </div>
    </Modal>
  )
}
