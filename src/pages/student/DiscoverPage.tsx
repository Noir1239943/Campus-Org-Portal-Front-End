import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bookmark, FileText, Search, SearchX } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api/client'
import { studentApi } from '@/api/student'
import { OrganizationCard } from '@/components/shared/OrganizationCard'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState } from '@/components/ui/Feedback'
import { Input, Select } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/Misc'
import { useDebounce } from '@/hooks/useDebounce'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/cn'
import type { Organization } from '@/types'

export default function DiscoverPage() {
  useDocumentTitle('Discover')
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [accepting, setAccepting] = useState(false)
  const [saved, setSaved] = useState(false)
  const debounced = useDebounce(search)

  const filters = { search: debounced, category, accepting, saved }
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['student', 'organizations', filters],
    queryFn: () => studentApi.organizations(filters),
    placeholderData: (prev) => prev,
  })

  const toggleSave = useMutation({
    mutationFn: (org: Organization) => studentApi.toggleSave(org.slug),
    onSuccess: (res, org) => {
      toast.success(res.saved ? `${org.acronym} saved` : `${org.acronym} removed from saved`)
      queryClient.invalidateQueries({ queryKey: ['student', 'organizations'] })
      queryClient.invalidateQueries({ queryKey: ['student', 'my-organizations'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  return (
    <>
      <PageHeader
        eyebrow="Campus directory"
        title="Find your community"
        description={`Explore ${data?.total ?? 'all'} recognized student organizations at Cordova Public College — academic, cultural, service, sports and media.`}
        actions={
          <Button variant="secondary" to="/applications" icon={<FileText className="size-4" />}>
            My applications
          </Button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            className="pl-9"
            placeholder="Search organizations, interests or keywords"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search organizations"
          />
        </div>
        <div className="flex gap-2">
          <Select value={category} onChange={(e) => setCategory(e.target.value)} className="lg:w-48" aria-label="Category">
            <option value="">All categories</option>
            {data?.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <button
            onClick={() => setAccepting((v) => !v)}
            className={cn(
              'h-10 rounded-lg px-3 text-sm font-medium whitespace-nowrap ring-1 ring-inset',
              accepting ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50',
            )}
            aria-pressed={accepting}
          >
            Accepting members
          </button>
          <button
            onClick={() => setSaved((v) => !v)}
            className={cn(
              'grid size-10 shrink-0 place-items-center rounded-lg ring-1 ring-inset',
              saved ? 'bg-blue-50 text-blue-700 ring-blue-200' : 'bg-white text-slate-500 ring-slate-200 hover:bg-slate-50',
            )}
            aria-pressed={saved}
            aria-label="Show saved only"
            title="Saved only"
          >
            <Bookmark className={cn('size-4', saved && 'fill-current')} />
          </button>
        </div>
      </div>

      <p className="mt-4 mb-3 text-xs text-slate-500">
        {isLoading ? 'Loading organizations…' : `Showing ${data?.data.length ?? 0} of ${data?.total ?? 0} organizations`}
      </p>

      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-60 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : data?.data.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.data.map((org) => (
            <OrganizationCard key={org.id} organization={org} onToggleSave={(o) => toggleSave.mutate(o)} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white">
          <EmptyState
            icon={<SearchX />}
            title="No organizations match"
            description="Try a different keyword or clear the filters."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('')
                  setCategory('')
                  setAccepting(false)
                  setSaved(false)
                }}
              >
                Clear filters
              </Button>
            }
          />
        </div>
      )}
    </>
  )
}
