import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck } from 'lucide-react'
import { notificationsApi } from '@/api/common'
import { cn } from '@/lib/cn'
import { relativeTime } from '@/lib/format'
import type { AppNotification } from '@/types'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Poll every minute so new approvals and announcements show up.
  const { data } = useQuery({
    queryKey: ['notifications', 'latest'],
    queryFn: () => notificationsApi.list(8),
    refetchInterval: 60_000,
  })

  const markAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const openNotification = async (n: AppNotification) => {
    setOpen(false)
    if (!n.read_at) {
      await notificationsApi.markRead(n.id).catch(() => undefined)
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
    if (n.link) navigate(n.link)
  }

  const unread = data?.unread ?? 0

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
      >
        <Bell className="size-[18px]" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-cpc-red px-1 text-[9px] leading-4 font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-pop-in absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            {unread > 0 && (
              <button onClick={() => markAll.mutate()} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
                <CheckCheck className="size-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {data?.data.length ? (
              data.data.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openNotification(n)}
                  className={cn('flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50', !n.read_at && 'bg-blue-50/40')}
                >
                  <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.read_at ? 'bg-transparent' : 'bg-blue-600')} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-800">{n.title}</span>
                    {n.body && <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">{n.body}</span>}
                    <span className="mt-1 block text-[11px] text-slate-400">{relativeTime(n.created_at)}</span>
                  </span>
                </button>
              ))
            ) : (
              <p className="px-4 py-8 text-center text-sm text-slate-500">You're all caught up.</p>
            )}
          </div>
          <button
            onClick={() => {
              setOpen(false)
              navigate('/notifications')
            }}
            className="block w-full border-t border-slate-100 px-4 py-2.5 text-center text-xs font-medium text-blue-600 hover:bg-slate-50"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  )
}
