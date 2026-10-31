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
  OfficerRow,
  OrgHealthRow,
  OrganizationProposal,
  ProposalStatus,
  StudentLookupRow,
  User,
} from '@/types'

export type ApprovalTab = 'pending' | 'upcoming' | 'completed' | 'rejected'

export interface OrganizationFormPayload {
  name: string
  acronym: string
  category: string
  tagline: string | null
  description: string
  about: string | null
  color: string
  adviser_name: string | null
  contact_email: string | null
  meeting_schedule: string | null
  accepting_members: boolean
  requires_all_students: boolean
  capacity: number | null
  /** Student ID number or email; only used when creating. */
  president?: string
}

export interface AdviserOrganizationDetail {
  organization: Organization
  health: OrgHealthRow
  /** False when the organization has event or attendance history (archive it instead). */
  can_delete: boolean
  history: { events: number; attendance: number }
  officers: OfficerRow[]
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

  createOrganization: (payload: OrganizationFormPayload) =>
    api.post<{ message: string; organization: Organization }>('/adviser/organizations', payload).then((r) => r.data),
  updateOrganization: (id: number, payload: OrganizationFormPayload) =>
    api.put<Organization>(`/adviser/organizations/${id}`, payload).then((r) => r.data),
  deleteOrganization: (id: number, confirm: string) =>
    api.delete<{ message: string }>(`/adviser/organizations/${id}`, { data: { confirm } }).then((r) => r.data),
  addOfficer: (id: number, payload: { identifier: string; position: string }) =>
    api.post<{ message: string; officers: OfficerRow[] }>(`/adviser/organizations/${id}/officers`, payload).then((r) => r.data),
  updateOfficer: (id: number, membershipId: number, payload: { position: string; is_officer: boolean }) =>
    api
      .patch<{ message: string; officers: OfficerRow[] }>(`/adviser/organizations/${id}/officers/${membershipId}`, payload)
      .then((r) => r.data),

  proposals: (status: ProposalStatus | 'all') =>
    api
      .get<{ data: OrganizationProposal[]; counts: Record<'pending' | 'approved' | 'rejected' | 'all', number> }>('/adviser/proposals', {
        params: { status },
      })
      .then((r) => r.data),
  approveProposal: (id: number, note?: string) =>
    api.post<OrganizationProposal>(`/adviser/proposals/${id}/approve`, { note }).then((r) => r.data),
  rejectProposal: (id: number, note: string) =>
    api.post<OrganizationProposal>(`/adviser/proposals/${id}/reject`, { note }).then((r) => r.data),

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
