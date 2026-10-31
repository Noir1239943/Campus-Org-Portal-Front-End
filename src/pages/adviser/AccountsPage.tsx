import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Download, KeyRound, Pencil, Search, Upload, UserCog, UserPlus, UserX, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { adviserApi, type AccountPayload, type ImportResult } from '@/api/adviser'
import { getErrorMessage, getFieldErrors } from '@/api/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Alert, EmptyState, ErrorState } from '@/components/ui/Feedback'
import { Checkbox, Field, Input, Select } from '@/components/ui/Field'
import { Avatar, PageHeader, Pills } from '@/components/ui/Misc'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/context/AuthContext'
import { useDebounce } from '@/hooks/useDebounce'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { relativeTime } from '@/lib/format'
import type { AccountRow } from '@/types'

const programs = ['BSIT', 'BEEd', 'BSEd', 'BSBA', 'BSHM']
const csvHeader = 'id_number,first_name,last_name,email,program,year_level,section'

type RoleFilter = 'all' | 'student' | 'adviser'

const emptyForm: AccountPayload = {
  role: 'student',
  id_number: '',
  first_name: '',
  last_name: '',
  email: '',
  program: programs[0],
  year_level: 1,
  section: '',
  title: '',
  password: '',
}

function TemporaryPassword({ name, password, onDismiss }: { name: string; password: string; onDismiss: () => void }) {
  return (
    <Alert
      className="mb-4"
      tone="success"
      icon={<KeyRound />}
      title={`Temporary password for ${name}`}
      action={
        <Button size="sm" variant="secondary" onClick={onDismiss}>
          Done
        </Button>
      }
    >
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <code className="rounded bg-white px-2 py-1 font-mono text-base text-slate-900">{password}</code>
        <Button size="sm" variant="secondary" icon={<Copy className="size-3.5" />} onClick={() => navigator.clipboard.writeText(password).then(() => toast.success('Copied'))}>
          Copy
        </Button>
      </div>
      <p className="mt-2 text-xs">Give this to the person in person. They&apos;ll be asked to change it when they first log in. It is shown only once.</p>
    </Alert>
  )
}

function AccountModal({ account, open, onClose, onSaved }: { account: AccountRow | null; open: boolean; onClose: () => void; onSaved: (name: string, temporary?: string) => void }) {
  const { user } = useAuth()
  const [form, setForm] = useState<AccountPayload>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const editing = !!account
  const isSelf = account?.id === user?.id

  useEffect(() => {
    if (!open) return
    setErrors({})
    setForm(
      account
        ? {
            role: account.role,
            id_number: account.id_number,
            first_name: account.first_name,
            last_name: account.last_name,
            email: account.email,
            program: account.program ?? programs[0],
            year_level: account.year_level ?? 1,
            section: account.section ?? '',
            title: account.title ?? '',
            password: '',
          }
        : emptyForm,
    )
  }, [open, account])

  const save = useMutation({
    mutationFn: () => {
      const payload: AccountPayload = {
        role: form.role,
        id_number: form.id_number.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        ...(form.role === 'student'
          ? { program: form.program, year_level: Number(form.year_level), section: form.section?.trim() || undefined }
          : { title: form.title?.trim() }),
        ...(!editing && form.password ? { password: form.password } : {}),
      }
      return editing
        ? adviserApi.updateAccount(account.id, payload).then((res) => ({ message: res.message, name: res.account.name, temporary: undefined as string | undefined }))
        : adviserApi.createAccount(payload).then((res) => ({ message: res.message, name: res.account.name, temporary: res.temporary_password as string | undefined }))
    },
    onSuccess: (res) => {
      toast.success(res.message)
      onSaved(res.name, res.temporary)
      onClose()
    },
    onError: (e) => {
      setErrors(getFieldErrors(e))
      toast.error(getErrorMessage(e))
    },
  })

  const set = <K extends keyof AccountPayload>(key: K, value: AccountPayload[K]) => setForm((f) => ({ ...f, [key]: value }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? `Edit ${account.name}` : 'New account'}
      description={editing ? undefined : 'They get a temporary password and must change it when they first log in.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={save.isPending} onClick={() => save.mutate()} disabled={!form.id_number.trim() || !form.first_name.trim() || !form.last_name.trim() || !form.email.trim()}>
            {editing ? 'Save changes' : 'Create account'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Account type" error={errors.role}>
          {() => (
            <Pills
              value={form.role}
              onChange={(role) => set('role', role)}
              items={[
                { value: 'student', label: 'Student' },
                { value: 'adviser', label: 'Adviser / OSA' },
              ]}
            />
          )}
        </Field>
        {isSelf && <p className="-mt-2 text-xs text-slate-500">You cannot change your own account type.</p>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" required error={errors.first_name}>
            {(id) => <Input id={id} value={form.first_name} onChange={(e) => set('first_name', e.target.value)} invalid={!!errors.first_name} />}
          </Field>
          <Field label="Last name" required error={errors.last_name}>
            {(id) => <Input id={id} value={form.last_name} onChange={(e) => set('last_name', e.target.value)} invalid={!!errors.last_name} />}
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="ID number (used to log in)" required error={errors.id_number}>
            {(id) => <Input id={id} value={form.id_number} autoCapitalize="none" onChange={(e) => set('id_number', e.target.value)} invalid={!!errors.id_number} />}
          </Field>
          <Field label="Email" required error={errors.email}>
            {(id) => <Input id={id} type="email" autoCapitalize="none" value={form.email} onChange={(e) => set('email', e.target.value)} invalid={!!errors.email} />}
          </Field>
        </div>

        {form.role === 'student' ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Program" required error={errors.program}>
              {(id) => (
                <Select id={id} value={form.program} onChange={(e) => set('program', e.target.value)}>
                  {programs.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Year level" required error={errors.year_level}>
              {(id) => (
                <Select id={id} value={form.year_level} onChange={(e) => set('year_level', Number(e.target.value))}>
                  {[1, 2, 3, 4].map((y) => (
                    <option key={y} value={y}>
                      Year {y}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Section" error={errors.section}>
              {(id) => <Input id={id} value={form.section} placeholder="BSIT 1-A" onChange={(e) => set('section', e.target.value)} />}
            </Field>
          </div>
        ) : (
          <Field label="Title" required error={errors.title}>
            {(id) => <Input id={id} value={form.title} placeholder="Faculty Adviser" onChange={(e) => set('title', e.target.value)} invalid={!!errors.title} />}
          </Field>
        )}

        {!editing && (
          <Field label="Temporary password" error={errors.password} hint="Leave blank to generate one, e.g. CPC-AB12-3456.">
            {(id) => <Input id={id} value={form.password} autoComplete="off" onChange={(e) => set('password', e.target.value)} invalid={!!errors.password} />}
          </Field>
        )}
      </div>
    </Modal>
  )
}

function ImportModal({ open, onClose, onImported }: { open: boolean; onClose: () => void; onImported: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setFile(null)
      setPassword('')
      setResult(null)
      setError('')
    }
  }, [open])

  const upload = useMutation({
    mutationFn: () => adviserApi.importStudents(file!, password),
    onSuccess: (res) => {
      setResult(res)
      setError('')
      onImported()
    },
    onError: (e) => {
      const fields = getFieldErrors(e)
      setError(fields.file ?? fields.temporary_password ?? getErrorMessage(e))
    },
  })

  const sample = `${csvHeader}\n2026-00001,Juan,Dela Cruz,juan.delacruz@cpc.edu.ph,BSIT,1,BSIT 1-A\n`
  const sampleUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(sample)}`

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import students (CSV)"
      description="Creates student accounts that must change their password at first login."
      footer={
        result ? (
          <Button onClick={onClose}>Close</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button loading={upload.isPending} disabled={!file || password.length < 8} icon={<Upload className="size-4" />} onClick={() => upload.mutate()}>
              Import
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className="space-y-3">
          <Alert tone="success" title={`${result.created} ${result.created === 1 ? 'account' : 'accounts'} created`}>
            Give the temporary password you chose to the students in person.
          </Alert>
          {result.skipped.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-900">{result.skipped.length} skipped</p>
              <ul className="max-h-56 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 text-sm">
                {result.skipped.map((s) => (
                  <li key={s.row} className="flex gap-3 px-3 py-2">
                    <span className="w-14 shrink-0 text-xs font-medium text-slate-500">Row {s.row}</span>
                    <span className="text-slate-700">{s.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}
          <p className="text-xs text-slate-500">
            First row must be <code className="rounded bg-slate-100 px-1 font-mono">{csvHeader}</code>. Up to 2000 rows. Programs: {programs.join(', ')}. Year level 1–4.{' '}
            <a href={sampleUrl} download="students-sample.csv" className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline">
              <Download className="size-3.5" /> Download sample CSV
            </a>
          </p>
          <Field label="CSV file" required>
            {(id) => <input id={id} type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200" />}
          </Field>
          <Field label="Temporary password for everyone" required hint="At least 8 characters. Students must change it at first login.">
            {(id) => <Input id={id} value={password} autoComplete="off" onChange={(e) => setPassword(e.target.value)} />}
          </Field>
        </div>
      )}
    </Modal>
  )
}

export default function AccountsPage() {
  useDocumentTitle('Accounts')
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<RoleFilter>('all')
  const [showDisabled, setShowDisabled] = useState(false)
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<AccountRow | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [temporary, setTemporary] = useState<{ name: string; password: string } | null>(null)
  const debounced = useDebounce(search)

  useEffect(() => setPage(1), [debounced, role, showDisabled])

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adviser', 'accounts', debounced, role, showDisabled, page],
    queryFn: () => adviserApi.accounts({ search: debounced, role, status: showDisabled ? 'all' : 'active', page }),
    placeholderData: (prev) => prev,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['adviser', 'accounts'] })

  const reset = useMutation({
    mutationFn: (account: AccountRow) => adviserApi.resetAccountPassword(account.id).then((res) => ({ account, res })),
    onSuccess: ({ account, res }) => {
      setTemporary({ name: account.name, password: res.temporary_password })
      invalidate()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const toggle = useMutation({
    mutationFn: (account: AccountRow) => (account.is_active ? adviserApi.disableAccount(account.id) : adviserApi.enableAccount(account.id)),
    onSuccess: (res) => {
      toast.success(res.message)
      invalidate()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  return (
    <>
      <PageHeader
        eyebrow="Student affairs"
        title="Accounts"
        description="Create and manage student and adviser accounts. Accounts are disabled, never deleted, so attendance and clearance history is kept."
        actions={
          <>
            <Button variant="secondary" icon={<Upload className="size-4" />} onClick={() => setImportOpen(true)}>
              Import students (CSV)
            </Button>
            <Button
              icon={<UserPlus className="size-4" />}
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              New account
            </Button>
          </>
        }
      />

      {temporary && <TemporaryPassword name={temporary.name} password={temporary.password} onDismiss={() => setTemporary(null)} />}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <Pills
            value={role}
            onChange={setRole}
            items={[
              { value: 'all', label: 'All' },
              { value: 'student', label: 'Students' },
              { value: 'adviser', label: 'Advisers' },
            ]}
          />
          <Checkbox label="Show disabled" checked={showDisabled} onChange={(e) => setShowDisabled(e.target.checked)} />
        </div>
        <div className="relative lg:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input type="search" className="pl-9" placeholder="Search name, ID number or email" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search accounts" />
        </div>
      </div>

      <Card className="mt-4 overflow-hidden">
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isLoading ? (
          <div className="h-80 animate-pulse" />
        ) : data?.data.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-slate-50/80">
                <tr className="text-left text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  <th className="px-5 py-3">Account</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Role</th>
                  <th className="px-3 py-3">Program / title</th>
                  <th className="px-3 py-3">Last login</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-5 py-3 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((a) => (
                  <tr key={a.id} className={a.is_active ? 'hover:bg-slate-50/60' : 'bg-slate-50/60 text-slate-400'}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar initials={`${a.first_name[0] ?? ''}${a.last_name[0] ?? ''}`.toUpperCase()} name={a.name} size="sm" />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800">{a.name}</p>
                          <p className="text-xs text-slate-500">{a.id_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{a.email}</td>
                    <td className="px-3 py-3">
                      <Badge tone={a.role === 'adviser' ? 'navy' : 'blue'}>{a.role === 'adviser' ? 'Adviser' : 'Student'}</Badge>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{a.program_label ?? a.title ?? '—'}</td>
                    <td className="px-3 py-3 text-xs text-slate-500">{a.last_login_at ? relativeTime(a.last_login_at) : 'Never'}</td>
                    <td className="px-3 py-3">
                      {!a.is_active ? <Badge tone="gray">Disabled</Badge> : a.must_change_password ? <Badge tone="amber">Must change password</Badge> : <Badge tone="green">Active</Badge>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Edit ${a.name}`}
                          onClick={() => {
                            setEditing(a)
                            setFormOpen(true)
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Reset password for ${a.name}`}
                          onClick={() => window.confirm(`Reset the password for ${a.name}? They will be signed out everywhere.`) && reset.mutate(a)}
                        >
                          <KeyRound className="size-4" />
                        </Button>
                        {a.id !== user?.id &&
                          (a.is_active ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-500 hover:bg-red-50 hover:text-red-600"
                              aria-label={`Disable ${a.name}`}
                              onClick={() => window.confirm(`Disable ${a.name}'s account? They will be signed out and cannot log in. Their history is kept.`) && toggle.mutate(a)}
                            >
                              <UserX className="size-4" />
                            </Button>
                          ) : (
                            <Button size="icon" variant="ghost" aria-label={`Enable ${a.name}`} onClick={() => toggle.mutate(a)}>
                              <UserCheck className="size-4" />
                            </Button>
                          ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<UserCog />} title="No accounts match" />
        )}
      </Card>

      {data && data.last_page > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            Page {data.current_page} of {data.last_page} · {data.total} accounts
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button size="sm" variant="secondary" disabled={page >= data.last_page} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <AccountModal
        open={formOpen}
        account={editing}
        onClose={() => setFormOpen(false)}
        onSaved={(name, password) => {
          if (password) setTemporary({ name, password })
          invalidate()
        }}
      />
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} onImported={invalidate} />
    </>
  )
}
