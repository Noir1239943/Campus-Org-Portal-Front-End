import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bookmark, Compass, Users } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api/client'
import { studentApi } from '@/api/student'
import { OrganizationCard } from '@/components/shared/OrganizationCard'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/Feedback'
import { PageHeader } from '@/components/ui/Misc'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import type { Organization } from '@/types'

export default function MyOrganizationsPage() {
  useDocumentTitle('My organizations')
  const queryClient = useQueryClient()
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['student', 'my-organizations'], queryFn: studentApi.myOrganizations })

  const toggleSave = useMutation({
    mutationFn: (org: Organization) => studentApi.toggleSave(org.slug),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['student'] }),
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  if (isLoading) return <PageLoader />
  if (error || !data) return <ErrorState error={error} onRetry={refetch} />

  return (
    <>
      <PageHeader
        eyebrow="Memberships"
        title="My organizations"
        description="Organizations you belong to and the ones you saved for later."
        actions={
          <Button to="/discover" icon={<Compass className="size-4" />}>
            Find more
          </Button>
        }
      />

      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Users className="size-4 text-slate-400" /> Member of ({data.memberships.length})
      </h2>
      {data.memberships.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.memberships.map((org) => (
            <OrganizationCard key={org.id} organization={org} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white">
          <EmptyState title="You haven't joined any organizations yet" action={<Button to="/discover">Discover organizations</Button>} />
        </div>
      )}

      <h2 className="mt-10 mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Bookmark className="size-4 text-slate-400" /> Saved ({data.saved.length})
      </h2>
      {data.saved.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.saved.map((org) => (
            <OrganizationCard key={org.id} organization={org} onToggleSave={(o) => toggleSave.mutate(o)} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60">
          <EmptyState icon={<Bookmark />} title="Nothing saved" description="Tap the bookmark on any organization to keep it here while you decide." />
        </div>
      )}
    </>
  )
}
