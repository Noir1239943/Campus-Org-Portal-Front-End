import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Megaphone } from 'lucide-react'
import { studentApi } from '@/api/student'
import { AnnouncementCard } from '@/components/shared/AnnouncementCard'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/Feedback'
import { PageHeader, Pills } from '@/components/ui/Misc'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function AnnouncementsPage() {
  useDocumentTitle('Announcements')
  const [filter, setFilter] = useState('all')
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['student', 'announcements'], queryFn: studentApi.announcements })

  const sources = useMemo(() => {
    const map = new Map<string, string>([['osa', 'OSA']])
    data?.forEach((a) => a.organization && map.set(String(a.organization.id), a.organization.acronym))
    return [...map.entries()]
  }, [data])

  if (isLoading) return <PageLoader />
  if (error || !data) return <ErrorState error={error} onRetry={refetch} />

  const filtered = data.filter((a) => filter === 'all' || (filter === 'osa' ? !a.organization : String(a.organization?.id) === filter))

  return (
    <>
      <PageHeader eyebrow="Announcements" title="What's new on campus" description="Updates from the Office of Student Affairs and your organizations — no more scrolling through group chats." />

      <Pills value={filter} onChange={setFilter} items={[{ value: 'all', label: 'All' }, ...sources.map(([value, label]) => ({ value, label }))]} />

      <div className="mt-4 space-y-3">
        {filtered.length ? (
          filtered.map((a) => <AnnouncementCard key={a.id} announcement={a} />)
        ) : (
          <Card>
            <EmptyState icon={<Megaphone />} title="No announcements" />
          </Card>
        )}
      </div>
    </>
  )
}
