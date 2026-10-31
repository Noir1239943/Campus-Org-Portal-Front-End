import { api } from './client'
import type {
  Announcement,
  Application,
  CampusEvent,
  CheckInResult,
  ClearancePage,
  Excuse,
  Organization,
  StudentDashboard,
} from '@/types'

export interface OrganizationFilters {
  search?: string
  category?: string
  accepting?: boolean
  saved?: boolean
}

export interface OrganizationDetail {
  organization: Organization
  upcoming_events: CampusEvent[]
  officers: { name: string; initials: string; position: string }[]
  announcements: Announcement[]
}

export interface ApplicationPayload {
  reason: string
  experience?: string
  availability?: string
  answer?: string
  agreed: boolean
}

export const studentApi = {
  dashboard: () => api.get<StudentDashboard>('/dashboard').then((r) => r.data),

  /* Organizations */
  organizations: (filters: OrganizationFilters) =>
    api
      .get<{ data: Organization[]; total: number; categories: string[] }>('/organizations', {
        params: {
          search: filters.search || undefined,
          category: filters.category || undefined,
          accepting: filters.accepting ? 1 : undefined,
          saved: filters.saved ? 1 : undefined,
        },
      })
      .then((r) => r.data),

  organization: (slug: string) => api.get<OrganizationDetail>(`/organizations/${slug}`).then((r) => r.data),

  toggleSave: (slug: string) => api.post<{ saved: boolean }>(`/organizations/${slug}/save`).then((r) => r.data),

  myOrganizations: () =>
    api.get<{ memberships: Organization[]; saved: Organization[] }>('/my/organizations').then((r) => r.data),

  /* Applications */
  apply: (slug: string, payload: ApplicationPayload) =>
    api.post<Application>(`/organizations/${slug}/applications`, payload).then((r) => r.data),

  applications: () => api.get<Application[]>('/applications').then((r) => r.data),

  application: (id: number | string) => api.get<Application>(`/applications/${id}`).then((r) => r.data),

  withdrawApplication: (id: number) => api.post<Application>(`/applications/${id}/withdraw`).then((r) => r.data),

  /* Events */
  events: (scope: 'mine' | 'browse' | 'past', params: { search?: string; type?: string } = {}) =>
    api
      .get<CampusEvent[]>('/events', { params: { scope, search: params.search || undefined, type: params.type || undefined } })
      .then((r) => r.data),

  event: (id: number | string) => api.get<CampusEvent>(`/events/${id}`).then((r) => r.data),

  register: (id: number) => api.post<{ message: string; event: CampusEvent }>(`/events/${id}/register`).then((r) => r.data),

  cancelRegistration: (id: number) =>
    api.delete<{ message: string; event: CampusEvent }>(`/events/${id}/register`).then((r) => r.data),

  fileExcuse: (eventId: number, payload: { reason: string; details: string }) =>
    api.post<Excuse>(`/events/${eventId}/excuse`, payload).then((r) => r.data),

  excuses: () => api.get<Excuse[]>('/excuses').then((r) => r.data),

  /* Check-in & clearance */
  checkIn: (payload: { code: string; event_id?: number; via?: 'qr' | 'code' }) =>
    api.post<CheckInResult>('/check-in', payload).then((r) => r.data),

  clearance: () => api.get<ClearancePage>('/clearance').then((r) => r.data),

  announcements: () => api.get<Announcement[]>('/announcements').then((r) => r.data),
}
