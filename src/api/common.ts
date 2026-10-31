import { api } from './client'
import type { AppNotification } from '@/types'

export const notificationsApi = {
  list: (limit = 50) =>
    api.get<{ data: AppNotification[]; unread: number }>('/notifications', { params: { limit } }).then((r) => r.data),

  unreadCount: () => api.get<{ unread: number }>('/notifications/unread-count').then((r) => r.data.unread),

  markRead: (id: number) => api.post<AppNotification>(`/notifications/${id}/read`).then((r) => r.data),

  markAllRead: () => api.post('/notifications/read-all'),
}
