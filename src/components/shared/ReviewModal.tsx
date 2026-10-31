import { useEffect, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Field, Textarea } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'

interface ReviewModalProps {
  open: boolean
  onClose: () => void
  mode: 'approve' | 'reject'
  title: string
  description?: ReactNode
  noteRequired?: boolean
  loading?: boolean
  onConfirm: (note: string) => void
  children?: ReactNode
}

/** Approve / reject with an optional (or required) note to the student. */
export function ReviewModal({ open, onClose, mode, title, description, noteRequired, loading, onConfirm, children }: ReviewModalProps) {
  const [note, setNote] = useState('')

  useEffect(() => {
    if (open) setNote('')
  }, [open])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={mode === 'approve' ? 'success' : 'primary'}
            className={mode === 'reject' ? 'bg-red-600 hover:bg-red-700' : undefined}
            loading={loading}
            disabled={noteRequired && note.trim().length < 5}
            onClick={() => onConfirm(note.trim())}
          >
            {mode === 'approve' ? 'Approve' : 'Send back'}
          </Button>
        </>
      }
    >
      {children}
      <Field
        className={children ? 'mt-4' : undefined}
        label={noteRequired ? 'What needs to change?' : 'Note to the student (optional)'}
        required={noteRequired}
        hint={mode === 'reject' ? 'Be kind and specific — the student will see this.' : 'They will see this in their notification.'}
      >
        {(id) => <Textarea id={id} rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />}
      </Field>
    </Modal>
  )
}
