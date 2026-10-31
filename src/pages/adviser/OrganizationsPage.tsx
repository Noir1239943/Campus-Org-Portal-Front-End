import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Search, Users } from 'lucide-react'
import { adviserApi } from '@/api/adviser'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState } from '@/components/ui/Feedback'
import { Input } from '@/components/ui/Field'
import { OrgMark, PageHeader, Pills } from '@/components/ui/Misc'
import { useDebounce } from '@/hooks/useDebounce'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDate, percent } from '@/lib/format'
import { healthStatus, orgStatus } from '@/lib/status'
import type { Health } from '@/types'

export default function AdviserOrganizationsPage() {
  useDocumentTitle('Organizations')
  const [search, setSearch] = useState('')
  const [health, setHealth] = useState<Health | ''>('')
  const debounced = useDebounce(search)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adviser', 'organizations', debounced, health],
    queryFn: () => adviserApi.organizations({ search: debounced, health }),
    placeholderData: (prev) => prev,
  })

  return (
    <>
      <PageHeader eyebrow="Student affairs" title="Organizations" description="Every recognized organization with membership, activity and attendance health." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Pills
          value={health}
          onChange={setHealth}
          items={[
            { value: '', label: 'All' },
            { value: 'healthy', label: 'Healthy' },
            { value: 'monitor', label: 'Monitor' },
            { value: 'at_risk', label: 'At risk' },
            { value: 'no_data', label: 'No data' },
          ]}
        />
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input type="search" className="pl-9" placeholder="Search organizations" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search organizations" />
        </div>
      </div>

      <Card className="mt-4 overflow-hidden">
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isLoading ? (
          <div className="h-80 animate-pulse" />
        ) : data?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-slate-50/80">
                <tr className="text-left text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  <th className="px-5 py-3">Organization</th>
                  <th className="px-3 py-3">Recognition</th>
                  <th className="px-3 py-3 text-right">Members</th>
                  <th className="px-3 py-3 text-right">Upcoming</th>
                  <th className="px-3 py-3 text-right">Pending apps</th>
                  <th className="px-3 py-3">Last event</th>
                  <th className="px-3 py-3 text-right">Attendance</th>
                  <th className="px-3 py-3">Health</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <Link to={`/adviser/organizations/${org.id}`} className="flex items-center gap-3">
                        <OrgMark acronym={org.acronym} color={org.color} size="sm" />
                        <span>
                          <span className="block font-medium text-slate-800 hover:text-blue-600">{org.name}</span>
                          <span className="block text-xs text-slate-500">
                            {org.category}
                            {org.adviser_name ? ` · ${org.adviser_name}` : ''}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={orgStatus[org.status].tone}>{orgStatus[org.status].label}</Badge>
                    </td>
                    <td className="px-3 py-3 text-right text-slate-600">{org.members_count}</td>
                    <td className="px-3 py-3 text-right text-slate-600">{org.upcoming_events_count}</td>
                    <td className="px-3 py-3 text-right text-slate-600">{org.pending_applications_count}</td>
                    <td className="px-3 py-3 text-xs text-slate-500">{formatDate(org.last_event_at)}</td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-800">{percent(org.attendance_rate)}</td>
                    <td className="px-3 py-3">
                      <Badge tone={healthStatus[org.health].tone}>{healthStatus[org.health].label}</Badge>
                    </td>
                    <td className="px-3 py-3">
                      <Link to={`/adviser/organizations/${org.id}`} aria-label={`Open ${org.name}`}>
                        <ChevronRight className="size-4 text-slate-300" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<Users />} title="No organizations match" />
        )}
      </Card>
    </>
  )
}
