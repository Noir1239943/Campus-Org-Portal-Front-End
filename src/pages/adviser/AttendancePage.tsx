import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ClipboardCheck, Download, TrendingUp, UserCheck, UserX } from 'lucide-react'
import { toast } from 'sonner'
import { adviserApi } from '@/api/adviser'
import { downloadFile, getErrorMessage } from '@/api/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/Feedback'
import { Checkbox, Select } from '@/components/ui/Field'
import { OrgMark, PageHeader, ProgressBar } from '@/components/ui/Misc'
import { StatCard } from '@/components/ui/StatCard'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/cn'
import { formatDate, percent } from '@/lib/format'

export default function AdviserAttendancePage() {
  useDocumentTitle('Attendance')
  const [orgId, setOrgId] = useState(0)
  const [below, setBelow] = useState(false)
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adviser', 'attendance', orgId, below],
    queryFn: () => adviserApi.attendance({ organization_id: orgId, below_threshold: below }),
    placeholderData: (prev) => prev,
  })

  if (isLoading) return <PageLoader />
  if (error || !data) return <ErrorState error={error} onRetry={refetch} />

  const { summary } = data

  return (
    <>
      <PageHeader
        eyebrow="Student affairs"
        title="Attendance across organizations"
        description="Completed events with their turnout. Events below the threshold may need follow-up with the officers."
        actions={
          <Button variant="secondary" icon={<Download className="size-4" />} onClick={() => downloadFile('/adviser/reports/attendance', 'attendance.csv').catch((e) => toast.error(getErrorMessage(e)))}>
            Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Average attendance" value={percent(summary.average)} hint={`${summary.events} completed events`} icon={<TrendingUp />} tone="green" />
        <StatCard label="Check-ins recorded" value={summary.attended.toLocaleString()} hint={`of ${summary.expected.toLocaleString()} expected`} icon={<UserCheck />} />
        <StatCard label="Absences" value={summary.absent.toLocaleString()} hint={`${summary.excused} excused`} icon={<UserX />} tone="amber" />
        <StatCard label="Below threshold" value={summary.below_threshold} hint={`Events under ${summary.threshold}%`} icon={<AlertTriangle />} tone="red" />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={orgId} onChange={(e) => setOrgId(Number(e.target.value))} className="sm:w-72" aria-label="Organization">
          <option value={0}>All organizations</option>
          {data.organizations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </Select>
        <Checkbox label={`Only events below ${summary.threshold}%`} checked={below} onChange={(e) => setBelow(e.target.checked)} />
      </div>

      <Card className="mt-4 overflow-hidden">
        {data.events.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50/80">
                <tr className="text-left text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  <th className="px-5 py-3">Event</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3 text-right">Expected</th>
                  <th className="px-3 py-3 text-right">Present</th>
                  <th className="px-3 py-3 text-right">Excused</th>
                  <th className="px-3 py-3 text-right">Absent</th>
                  <th className="px-5 py-3">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.events.map((e) => {
                  const rate = e.stats?.rate ?? null
                  const low = rate !== null && rate < summary.threshold
                  return (
                    <tr key={e.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {e.organization && <OrgMark acronym={e.organization.acronym} color={e.organization.color} size="sm" />}
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-800">{e.title}</p>
                            <p className="text-xs text-slate-500">
                              {e.organization?.acronym} · {e.type}
                              {e.is_mandatory && ' · Required'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-500">{formatDate(e.starts_at)}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{e.stats?.expected}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{e.stats?.attended}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{e.stats?.excused}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{e.stats?.absent}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={rate ?? 0} tone={low ? 'amber' : 'green'} className="w-20" />
                          <span className={cn('w-10 text-right font-semibold', low ? 'text-amber-600' : 'text-slate-800')}>{percent(rate)}</span>
                          {low && <Badge tone="amber">Low</Badge>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<ClipboardCheck />} title="No events match" />
        )}
      </Card>
    </>
  )
}
