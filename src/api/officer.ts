import { api } from './client'
import type {
  Announcement,
  Application,
  AttendancePageData,
  CampusEvent,
  CheckInCode,
  Excuse,
  MemberRow,
  OfficerOverview,
  Organization,
} from '@/types'

export interface EventPayload {
  title: string
  type: string
  description: string
  venue: string
  starts_at: string
  ends_at: string
  capacity: number | null
  visibility: 'open' | 'members'
  is_mandatory: boolean
  service_hours: number
  speaker: string
  action: 'draft' | 'submit'
}

export interface AnnouncementPayload {
  title: string
  body: string
  audience?: 'all' | 'members'
  is_pinned: boolean
  notify?: boolean
}

export type OrganizationSettingsPayload = Pick<
  Organization,
  | 'tagline'
  | 'description'
  | 'about'
  | 'color'
  | 'contact_email'
  | 'facebook_url'
  | 'meeting_schedule'
  | 'tags'
  | 'accepting_members'
  | 'capacity'
  | 'application_deadline'
  | 'application_question'
>

export type EventTab = 'upcoming' | 'past' | 'drafts' | 'cancelled'

export const officerApi = {
  overview: () => api.get<OfficerOverview>('/officer/overview').then((r) => r.data),

  /* Membership applications */
  applications: (status: string) =>
    api
      .get<{ data: Application[]; counts: Record<string, number> }>('/officer/applications', { params: { status } })
      .then((r) => r.data),
  approveApplication: (id: number, note?: string) =>
    api.post<Application>(`/officer/applications/${id}/approve`, { note }).then((r) => r.data),
  rejectApplication: (id: number, note?: string) =>
    api.post<Application>(`/officer/applications/${id}/reject`, { note }).then((r) => r.data),

  /* Members */
  members: (params: { search?: string; filter?: string }) =>
    api
      .get<{ data: MemberRow[]; counts: { all: number; officers: number; at_risk: number } }>('/officer/members', {
        params: { search: params.search || undefined, filter: params.filter },
      })
      .then((r) => r.data),
  addMember: (payload: { identifier: string; position?: string }) =>
    api.post<{ message: string }>('/officer/members', payload).then((r) => r.data),
  updateMember: (id: number, payload: { position: string; is_officer: boolean }) =>
    api.patch(`/officer/members/${id}`, payload).then((r) => r.data),
  removeMember: (id: number) => api.delete(`/officer/members/${id}`).then((r) => r.data),

  /* Events */
  events: (tab: EventTab) =>
    api
      .get<{ data: CampusEvent[]; counts: Record<EventTab, number>; types: string[] }>('/officer/events', { params: { tab } })
      .then((r) => r.data),
  event: (id: number | string) => api.get<CampusEvent>(`/officer/events/${id}`).then((r) => r.data),
  createEvent: (payload: EventPayload) => api.post<CampusEvent>('/officer/events', payload).then((r) => r.data),
  updateEvent: (id: number, payload: EventPayload) => api.put<CampusEvent>(`/officer/events/${id}`, payload).then((r) => r.data),
  submitEvent: (id: number) => api.post<CampusEvent>(`/officer/events/${id}/submit`).then((r) => r.data),
  cancelEvent: (id: number) => api.post<CampusEvent>(`/officer/events/${id}/cancel`).then((r) => r.data),
  deleteEvent: (id: number) => api.delete(`/officer/events/${id}`).then((r) => r.data),

  /* Attendance */
  attendance: (eventId: number | string) =>
    api.get<AttendancePageData>(`/officer/events/${eventId}/attendance`).then((r) => r.data),
  openCheckIn: (eventId: number) => api.post<CheckInCode>(`/officer/events/${eventId}/check-in/open`).then((r) => r.data),
  closeCheckIn: (eventId: number) => api.post(`/officer/events/${eventId}/check-in/close`).then((r) => r.data),
  checkInCode: (eventId: number) => api.get<CheckInCode>(`/officer/events/${eventId}/check-in/code`).then((r) => r.data),
  mark: (eventId: number, payload: { user_id?: number; identifier?: string; status: string }) =>
    api.post<{ message: string }>(`/officer/events/${eventId}/attendance`, payload).then((r) => r.data),

  /* Excuses */
  excuses: (status: string) =>
    api
      .get<{ data: Excuse[]; counts: Record<string, number> }>('/officer/excuses', { params: { status } })
      .then((r) => r.data),
  approveExcuse: (id: number, note?: string) => api.post<Excuse>(`/officer/excuses/${id}/approve`, { note }).then((r) => r.data),
  rejectExcuse: (id: number, note?: string) => api.post<Excuse>(`/officer/excuses/${id}/reject`, { note }).then((r) => r.data),

  /* Announcements */
  announcements: () => api.get<Announcement[]>('/officer/announcements').then((r) => r.data),
  createAnnouncement: (payload: AnnouncementPayload) =>
    api.post<Announcement>('/officer/announcements', payload).then((r) => r.data),
  updateAnnouncement: (id: number, payload: AnnouncementPayload) =>
    api.put<Announcement>(`/officer/announcements/${id}`, payload).then((r) => r.data),
  deleteAnnouncement: (id: number) => api.delete(`/officer/announcements/${id}`).then((r) => r.data),

  /* Organization settings */
  organization: () => api.get<Organization>('/officer/organization').then((r) => r.data),
  updateOrganization: (payload: OrganizationSettingsPayload) =>
    api.put<Organization>('/officer/organization', payload).then((r) => r.data),
}
