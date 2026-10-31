import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Copy, GraduationCap, KeyRound, Search, ShieldAlert, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { adviserApi } from '@/api/adviser'
import { getErrorMessage } from '@/api/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Alert, EmptyState, ErrorState, Spinner } from '@/components/ui/Feedback'
import { Input } from '@/components/ui/Field'
import { Avatar, Detail, PageHeader } from '@/components/ui/Misc'
import { Modal } from '@/components/ui/Modal'
import { useDebounce } from '@/hooks/useDebounce'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { percent, relativeTime } from '@/lib/format'
import type { StudentLookupRow } from '@/types'

function StudentModal({ student, onClose }: { student: StudentLookupRow | null; onClose: () => void }) {
  const [temporary, setTemporary] = useState<string | null>(null)
  const detail = useQuery({ queryKey: ['adviser', 'student', student?.id], queryFn: () => adviserApi.student(student!.id), enabled: !!student })

  const reset = useMutation({
    mutationFn: () => adviserApi.resetPassword(student!.id),
    onSuccess: (res) => setTemporary(res.temporary_password),
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const close = () => {
    setTemporary(null)
    onClose()
  }

  return (
    <Modal open={!!student} onClose={close} title={student?.name ?? ''} description={`${student?.id_number} · ${student?.program_label ?? ''}`} size="lg">
      {detail.isLoading ? (
        <div className="grid place-items-center py-10">
          <Spinner />
        </div>
      ) : detail.data ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Detail label="Attendance rate">{percent(detail.data.summary.rate)}</Detail>
            <Detail label="Service hours">
              {detail.data.summary.service_hours} / {detail.data.summary.service_hours_goal}
            </Detail>
            <Detail label="Last login">{detail.data.last_login_at ? relativeTime(detail.data.last_login_at) : 'Never'}</Detail>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-500">Clearance</p>
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {detail.data.clearance.items.map((item) => (
                <li key={item.organization.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <span className="min-w-0 truncate text-slate-800">
                    {item.organization.acronym} <span className="text-xs text-slate-400">· {item.position}</span>
                  </span>
                  {item.status === 'cleared' ? (
                    <Badge tone="green"><ShieldCheck className="size-3" /> Cleared</Badge>
                  ) : (
                    <Badge tone={item.status === 'under_review' ? 'amber' : 'red'}>
                      <ShieldAlert className="size-3" /> {item.missed.length} missed
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Forgot password?</p>
            <p className="mt-1 text-xs text-slate-500">Check the student's school ID first. A temporary password signs them out everywhere; they should change it right after logging in.</p>
            {temporary ? (
              <Alert tone="success" className="mt-3" title="Temporary password">
                <div className="mt-1 flex items-center gap-2">
                  <code className="rounded bg-white px-2 py-1 font-mono text-base text-slate-900">{temporary}</code>
                  <Button size="sm" variant="secondary" icon={<Copy className="size-3.5" />} onClick={() => navigator.clipboard.writeText(temporary).then(() => toast.success('Copied'))}>
                    Copy
                  </Button>
                </div>
                <p className="mt-2 text-xs">Shown once. Give it to the student in person.</p>
              </Alert>
            ) : (
              <Button className="mt-3" variant="secondary" icon={<KeyRound className="size-4" />} loading={reset.isPending} onClick={() => window.confirm(`Reset the password for ${student?.name}?`) && reset.mutate()}>
                Create temporary password
              </Button>
            )}
          </div>
        </div>
      ) : (
        <ErrorState error={detail.error} />
      )}
    </Modal>
  )
}

export default function StudentsPage() {
  useDocumentTitle('Students')
  const [params] = useSearchParams()
  const [search, setSearch] = useState(params.get('search') ?? '')
  const [selected, setSelected] = useState<StudentLookupRow | null>(null)
  const debounced = useDebounce(search)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adviser', 'students', debounced],
    queryFn: () => adviserApi.students(debounced),
    placeholderData: (prev) => prev,
  })

  return (
    <>
      <PageHeader eyebrow="Student affairs" title="Students" description="Look up a student's participation and clearance, or help them get back into their account." />

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
        <Input type="search" className="pl-9" placeholder="Search by name, ID number or email" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search students" />
      </div>

      <Card className="mt-4">
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isLoading ? (
          <div className="h-64 animate-pulse" />
        ) : data?.length ? (
          <ul className="divide-y divide-slate-100">
            {data.map((s) => (
              <li key={s.id}>
                <button onClick={() => setSelected(s)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-slate-50">
                  <Avatar initials={s.initials} name={s.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-500">
                      {s.id_number} · {s.program_label}
                    </p>
                  </div>
                  <span className="hidden text-xs text-slate-500 sm:block">{s.organizations_count} organizations</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<GraduationCap />} title="No students found" />
        )}
      </Card>
      <p className="mt-2 text-xs text-slate-400">Showing up to 50 results. Refine your search to narrow it down.</p>

      <StudentModal student={selected} onClose={() => setSelected(null)} />
    </>
  )
}
