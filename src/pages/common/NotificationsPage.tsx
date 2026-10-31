import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck } from 'lucide-react'
import { notificationsApi } from '@/api/common'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/Feedback'
import { PageHeader } from '@/components/ui/Misc'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/cn'
import { formatDateTime, relativeTime } from '@/lib/format'
import type { AppNotification } from '@/types'

export default function NotificationsPage() {
  useDocumentTitle('Notifications')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['notifications', 'all'], queryFn: () => notificationsApi.list(100) })

  const markAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const open = async (n: AppNotification) => {
    if (!n.read_at) {
      await notificationsApi.markRead(n.id).catch(() => undefined)
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
    if (n.link) navigate(n.link)
  }

  if (isLoading) return <PageLoader />
  if (error || !data) return <ErrorState error={error} onRetry={refetch} />

  return (
    <>
      <PageHeader
        title="Notifications"
        description={data.unread ? `${data.unread} unread` : "You're all caught up."}
        actions={
          data.unread > 0 && (
            <Button variant="secondary" icon={<CheckCheck className="size-4" />} loading={markAll.isPending} onClick={() => markAll.mutate()}>
              Mark all as read
            </Button>
          )
        }
      />

      <Card>
        {data.data.length ? (
          <ul className="divide-y divide-slate-100">
            {data.data.map((n) => (
              <li key={n.id}>
                <button onClick={() => open(n)} className={cn('flex w-full gap-4 px-5 py-4 text-left hover:bg-slate-50', !n.read_at && 'bg-blue-50/40')}>
                  <span className={cn('mt-2 size-2 shrink-0 rounded-full', n.read_at ? 'bg-slate-200' : 'bg-blue-600')} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900">{n.title}</span>
                      <span className="text-xs text-slate-400" title={formatDateTime(n.created_at)}>
                        {relativeTime(n.created_at)}
                      </span>
                    </span>
                    {n.body && <span className="mt-0.5 block text-sm text-slate-600">{n.body}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<Bell />} title="No notifications yet" description="Application decisions, new events and announcements will show up here." />
        )}
      </Card>
    </>
  )
}
