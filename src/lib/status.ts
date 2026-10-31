import type { BadgeTone } from '@/components/ui/Badge'
import type { ApplicationStatus, AttendanceStatus, EventDisplayStatus, ExcuseStatus, Health, OrgStatus, ProposalStatus } from '@/types'

type StatusMeta = { label: string; tone: BadgeTone }

export const applicationStatus: Record<ApplicationStatus, StatusMeta> = {
  pending: { label: 'Under review', tone: 'amber' },
  approved: { label: 'Approved', tone: 'green' },
  rejected: { label: 'Not approved', tone: 'red' },
  withdrawn: { label: 'Withdrawn', tone: 'gray' },
}

export const proposalStatus: Record<ProposalStatus, StatusMeta> = {
  pending: { label: 'Waiting for OSA', tone: 'amber' },
  approved: { label: 'Approved', tone: 'green' },
  rejected: { label: 'Returned', tone: 'red' },
  withdrawn: { label: 'Withdrawn', tone: 'gray' },
}

export const eventStatus: Record<EventDisplayStatus, StatusMeta> = {
  draft: { label: 'Draft', tone: 'gray' },
  pending: { label: 'For approval', tone: 'amber' },
  published: { label: 'Published', tone: 'green' },
  rejected: { label: 'Returned', tone: 'red' },
  cancelled: { label: 'Cancelled', tone: 'gray' },
  upcoming: { label: 'Published', tone: 'green' },
  ongoing: { label: 'Happening now', tone: 'blue' },
  completed: { label: 'Completed', tone: 'gray' },
}

export const attendanceStatus: Record<AttendanceStatus, StatusMeta> = {
  present: { label: 'Present', tone: 'green' },
  late: { label: 'Late', tone: 'amber' },
  excused: { label: 'Excused', tone: 'violet' },
  absent: { label: 'Absent', tone: 'red' },
  pending: { label: 'Not yet', tone: 'gray' },
}

export const excuseStatus: Record<ExcuseStatus, StatusMeta> = {
  pending: { label: 'Excuse under review', tone: 'amber' },
  approved: { label: 'Excuse approved', tone: 'green' },
  rejected: { label: 'Excuse not approved', tone: 'red' },
}

export const healthStatus: Record<Health, StatusMeta> = {
  healthy: { label: 'Healthy', tone: 'green' },
  monitor: { label: 'Monitor', tone: 'amber' },
  at_risk: { label: 'At risk', tone: 'red' },
  no_data: { label: 'No data yet', tone: 'gray' },
}

export const orgStatus: Record<OrgStatus, StatusMeta> = {
  active: { label: 'Good standing', tone: 'green' },
  probation: { label: 'Probation', tone: 'amber' },
  inactive: { label: 'Archived', tone: 'gray' },
}

export const categoryTone: Record<string, BadgeTone> = {
  Academic: 'blue',
  Governance: 'navy',
  'Arts & Culture': 'violet',
  Service: 'green',
  Sports: 'orange',
  Media: 'gray',
}

export const organizationCategories = ['Academic', 'Governance', 'Arts & Culture', 'Service', 'Sports', 'Media']

export const officerPositions = ['President', 'Vice President', 'Secretary', 'Treasurer', 'Auditor', 'P.R.O.', 'Events Committee', 'Officer']

export const excuseReasons: { value: string; label: string }[] = [
  { value: 'illness', label: 'Illness or medical appointment' },
  { value: 'class_conflict', label: 'Class, exam or academic conflict' },
  { value: 'family', label: 'Family matter' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'work', label: 'Work schedule' },
  { value: 'other', label: 'Other' },
]

export const eventTypes = ['Seminar', 'Workshop', 'Meeting', 'Assembly', 'Outreach', 'Competition', 'Social']

export const checkInMethod: Record<string, string> = {
  qr: 'QR scan',
  code: 'Code',
  manual: 'Marked by officer',
  walk_in: 'Walk-in',
  excuse: 'Excuse',
}
