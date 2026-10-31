import { api } from './client'
import type { AnnouncementPayload } from './officer'
import type {
  AdviserOverview,
  Announcement,
  AttendanceSummary,
  CampusEvent,
  Clearance,
  Health,
  Organization,
  OrgHealthRow,
  StudentLookupRow,
  User,
} from '@/types'

export type ApprovalTab = 'pending' | 'upcoming' | 'completed' | 'rejected'

export interface AdviserOrganizationDetail {
  organization: Organization
  health: OrgHealthRow
  officers: { name: string; initials: string; id_number: string; email: string; position: string }[]
  recent_events: CampusEvent[]
  upcoming_events: CampusEvent[]
}

export interface AdviserAttendance {
  summary: {
    events: number
    expected: number
    attended: number
    excused: number
    absent: number
    average: number | null
    below_threshold: number
    threshold: number
  }
  events: CampusEvent[]
  organizations: { id: number; name: string; acronym: string }[]
}

export const adviserApi = {
  overview: () => api.get<AdviserOverview>('/adviser/overview').then((r) => r.data),

  organizations: (params: { search?: string; health?: Health | '' }) =>
    api
      .get<OrgHealthRow[]>('/adviser/organizations', {
        params: { search: params.search || undefined, health: params.health || undefined },
      })
      .then((r) => r.data),
  organization: (id: number | string) =>
    api.get<AdviserOrganizationDetail>(`/adviser/organizations/${id}`).then((r) => r.data),
  updateOrganizationStatus: (id: number, payload: { status: string; note?: string }) =>
    api.patch<{ message: string }>(`/adviser/organizations/${id}/status`, payload).then((r) => r.data),

  events: (tab: ApprovalTab) =>
    api
      .get<{ data: CampusEvent[]; counts: Record<ApprovalTab, number> }>('/adviser/events', { params: { tab } })
      .then((r) => r.data),
  approveEvent: (id: number, note?: string) => api.post<CampusEvent>(`/adviser/events/${id}/approve`, { note }).then((r) => r.data),
  rejectEvent: (id: number, note: string) => api.post<CampusEvent>(`/adviser/events/${id}/reject`, { note }).then((r) => r.data),

  attendance: (params: { organization_id?: number; below_threshold?: boolean }) =>
    api
      .get<AdviserAttendance>('/adviser/attendance', {
        params: {
          organization_id: params.organization_id || undefined,
          below_threshold: params.below_threshold ? 1 : undefined,
        },
      })
      .then((r) => r.data),

  students: (search: string) =>
    api.get<StudentLookupRow[]>('/adviser/students', { params: { search: search || undefined } }).then((r) => r.data),
  student: (id: number) =>
    api
      .get<{ student: User; last_login_at: string | null; summary: AttendanceSummary; clearance: Clearance }>(
        `/adviser/students/${id}`,
      )
      .then((r) => r.data),
  resetPassword: (id: number) =>
    api
      .post<{ message: string; temporary_password: string }>(`/adviser/students/${id}/reset-password`)
      .then((r) => r.data),

  announcements: () => api.get<Announcement[]>('/adviser/announcements').then((r) => r.data),
  createAnnouncement: (payload: AnnouncementPayload) =>
    api.post<Announcement>('/adviser/announcements', payload).then((r) => r.data),
  updateAnnouncement: (id: number, payload: AnnouncementPayload) =>
    api.put<Announcement>(`/adviser/announcements/${id}`, payload).then((r) => r.data),
  deleteAnnouncement: (id: number) => api.delete(`/adviser/announcements/${id}`).then((r) => r.data),
}
