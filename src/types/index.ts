/* Types that mirror the Laravel API resources. */

export type Role = 'student' | 'adviser'
export type Workspace = 'student' | 'officer' | 'adviser'

export interface User {
  id: number
  id_number: string
  name: string
  first_name: string
  last_name: string
  initials: string
  email: string
  role: Role
  program: string | null
  year_level: number | null
  section: string | null
  program_label: string | null
  phone: string | null
  title: string | null
}

export interface UserBrief {
  id: number
  id_number: string
  name: string
  initials: string
  email: string
  program_label: string | null
}

export interface CampusMeta {
  school_name: string
  school_short: string
  location: string
  osa_email: string
  academic_year: string
  semester: string
  service_hours_goal: number
  attendance_threshold: number
  late_after_minutes: number
  excuse_window_days: number
  require_event_approval: boolean
  check_in_code_seconds: number
}

export interface OfficerOrganization {
  id: number
  slug: string
  name: string
  acronym: string
  color: string
  position: string
}

export interface Session {
  user: User
  workspaces: Workspace[]
  officer_organizations: OfficerOrganization[]
  campus: CampusMeta
}

export interface LoginResponse extends Session {
  token: string
}

/* ------------------------------------------------------------------ */
/* Organizations                                                       */
/* ------------------------------------------------------------------ */

export type OrgStatus = 'active' | 'probation' | 'inactive'

export interface OrgBrief {
  id: number
  slug: string
  name: string
  acronym: string
  category?: string
  color: string
}

export interface OrganizationViewer {
  membership: { position: string; is_officer: boolean; joined_at: string | null } | null
  application: { id: number; reference: string; status: ApplicationStatus } | null
  is_saved: boolean
}

export interface Organization extends OrgBrief {
  category: string
  tagline: string | null
  description: string
  about: string | null
  adviser_name: string | null
  contact_email: string | null
  facebook_url: string | null
  meeting_schedule: string | null
  tags: string[]
  accepting_members: boolean
  is_open_for_applications: boolean
  capacity: number | null
  application_deadline: string | null
  application_question: string | null
  requires_all_students: boolean
  status: OrgStatus
  recognized_at: string | null
  members_count?: number
  upcoming_events_count?: number
  events_count?: number
  new_members_count?: number
  viewer?: OrganizationViewer
}

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

export type EventStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'cancelled'
export type EventDisplayStatus = EventStatus | 'upcoming' | 'ongoing' | 'completed'
export type AttendanceStatus = 'present' | 'late' | 'excused' | 'absent' | 'pending'

export interface EventStats {
  expected: number
  present: number
  late: number
  attended: number
  excused: number
  not_checked_in: number
  absent: number
  rate: number | null
}

export interface EventViewer {
  is_member: boolean
  registered: boolean
  expected: boolean
  mandatory_for_me: boolean
  attendance_status: AttendanceStatus | null
  checked_in_at: string | null
  excuse_status: ExcuseStatus | null
  excuse_note: string | null
  is_full: boolean
  can_register: boolean
  can_cancel: boolean
  can_check_in: boolean
  can_file_excuse: boolean
}

export interface CampusEvent {
  id: number
  title: string
  type: string
  description: string | null
  venue: string
  starts_at: string
  ends_at: string
  capacity: number | null
  visibility: 'open' | 'members'
  is_mandatory: boolean
  service_hours: number
  speaker: string | null
  status: EventStatus
  display_status: EventDisplayStatus
  review_note: string | null
  submitted_at: string | null
  reviewed_at: string | null
  check_in_open: boolean
  organization?: OrgBrief
  creator?: UserBrief | null
  registrations_count?: number
  stats?: EventStats
  viewer?: EventViewer
}

export interface EventBrief {
  id: number
  title: string
  type: string
  venue: string
  starts_at: string
  ends_at: string
  is_mandatory: boolean
  display_status: EventDisplayStatus
  organization: OrgBrief | null
}

/* ------------------------------------------------------------------ */
/* Applications, excuses, announcements, notifications                 */
/* ------------------------------------------------------------------ */

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn'

export interface Application {
  id: number
  reference: string
  status: ApplicationStatus
  reason: string
  experience: string | null
  availability: string | null
  answer: string | null
  submitted_at: string
  eligibility_verified_at: string | null
  reviewed_at: string | null
  review_note: string | null
  organization?: OrgBrief & { application_question: string | null }
  applicant?: UserBrief
  reviewer?: string | null
}

export type ExcuseStatus = 'pending' | 'approved' | 'rejected'

export interface Excuse {
  id: number
  reason: string
  reason_label: string
  details: string
  status: ExcuseStatus
  submitted_at: string
  reviewed_at: string | null
  review_note: string | null
  event?: EventBrief
  student?: UserBrief
  reviewer?: string | null
}

export interface Announcement {
  id: number
  title: string
  body: string
  audience: 'all' | 'members'
  is_pinned: boolean
  published_at: string
  organization: OrgBrief | null
  author: { name: string; title: string | null } | null
}

export interface AppNotification {
  id: number
  type: string
  title: string
  body: string | null
  link: string | null
  read_at: string | null
  created_at: string
}

/* ------------------------------------------------------------------ */
/* Student pages                                                       */
/* ------------------------------------------------------------------ */

export interface AttendanceSummary {
  total: number
  attended: number
  excused: number
  missed: number
  rate: number | null
  service_hours: number
  service_hours_goal: number
}

export interface MyOrganizationCard {
  id: number
  slug: string
  name: string
  acronym: string
  color: string
  category: string
  position: string
  is_officer: boolean
  members_count: number
}

export interface StudentDashboard {
  stats: {
    organizations: number
    upcoming_events: number
    upcoming_this_week: number
    attendance: AttendanceSummary
  }
  check_in_now: CampusEvent[]
  upcoming_events: CampusEvent[]
  organizations: MyOrganizationCard[]
  pending_application: Application | null
  announcements: Announcement[]
  clearance: { overall: 'cleared' | 'pending'; cleared: number; total: number; action_needed: number }
}

export interface ClearanceMissed {
  event_id: number
  title: string
  starts_at: string
  venue: string
  excuse_status: ExcuseStatus | null
  can_file_excuse: boolean
}

export interface ClearanceItem {
  organization: OrgBrief
  position: string
  required: number
  attended: number
  excused: number
  missed: ClearanceMissed[]
  status: 'cleared' | 'under_review' | 'action_needed'
}

export interface Clearance {
  overall: 'cleared' | 'pending'
  cleared: number
  total: number
  items: ClearanceItem[]
}

export interface AttendanceHistoryRow {
  id: number
  title: string
  type: string
  venue: string
  starts_at: string
  is_mandatory: boolean
  service_hours: number
  organization: OrgBrief
  status: AttendanceStatus
  checked_in_at: string | null
}

export interface ClearancePage {
  summary: AttendanceSummary
  clearance: Clearance
  history: AttendanceHistoryRow[]
}

export interface CheckInResult {
  already_checked_in: boolean
  attendance: { status: AttendanceStatus; method: string; checked_in_at: string | null; reference: string }
  event: EventBrief
  summary: AttendanceSummary
}

/* ------------------------------------------------------------------ */
/* Officer pages                                                       */
/* ------------------------------------------------------------------ */

export interface ChecklistItem {
  label: string
  done: boolean
  link: string
}

export interface MemberRow {
  membership_id: number
  user: UserBrief
  position: string
  is_officer: boolean
  joined_at: string | null
  events_expected: number
  events_attended: number
  attendance_rate: number | null
  status: 'active' | 'at_risk'
}

export interface OfficerOverview {
  organization: OrgBrief & { status: OrgStatus }
  stats: {
    members: number
    new_members: number
    pending_applications: number
    stale_applications: number
    upcoming_events: number
    average_attendance: number | null
    completed_events: number
    pending_excuses: number
  }
  pending_applications: Application[]
  next_event: CampusEvent | null
  recent_members: {
    membership_id: number
    user: { id: number; name: string; initials: string; id_number: string }
    position: string
    attendance_rate: number | null
    status: 'active' | 'at_risk'
  }[]
  checklist: ChecklistItem[]
}

export interface RosterRow {
  user: { id: number; id_number: string; name: string; initials: string; program_label: string | null }
  registered: boolean
  status: AttendanceStatus
  method: string | null
  checked_in_at: string | null
}

export interface AttendancePageData {
  event: CampusEvent
  stats: EventStats
  check_in: { open: boolean; opened_at: string | null; closed_at: string | null; late_after_minutes: number }
  roster: RosterRow[]
  recent: { name: string; initials: string; method: string | null; status: AttendanceStatus; checked_in_at: string | null }[]
}

export interface CheckInCode {
  open: boolean
  code?: string
  url?: string
  expires_in?: number
  period?: number
}

/* ------------------------------------------------------------------ */
/* Adviser pages                                                       */
/* ------------------------------------------------------------------ */

export type Health = 'healthy' | 'monitor' | 'at_risk' | 'no_data'

export interface OrgHealthRow {
  id: number
  slug: string
  name: string
  acronym: string
  category: string
  color: string
  status: OrgStatus
  adviser_name: string | null
  members_count: number
  events_count: number
  upcoming_events_count: number
  completed_events: number
  pending_applications_count: number
  attendance_rate: number | null
  last_event_at: string | null
  health: Health
}

export interface AdviserOverview {
  stats: {
    organizations: number
    organizations_good_standing: number
    organizations_under_review: number
    memberships: number
    students_involved: number
    events_this_term: number
    events_next_30_days: number
    attendance_risks: number
    pending_event_approvals: number
    probation: number
  }
  activity: { month: string; events: number; is_current: boolean }[]
  attendance: {
    average: number | null
    completed_events: number
    buckets: { label: string; count: number; tone: 'success' | 'primary' | 'warning' }[]
  }
  organizations: OrgHealthRow[]
  alerts: { level: 'danger' | 'warning' | 'info'; title: string; message: string; link: string }[]
}

export interface StudentLookupRow extends User {
  organizations_count: number
  last_login_at: string | null
}
