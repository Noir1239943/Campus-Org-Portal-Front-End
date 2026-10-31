import {
  BarChart3,
  CalendarCheck2,
  CalendarDays,
  ClipboardCheck,
  Compass,
  FileCheck2,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  QrCode,
  Settings2,
  ShieldCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { Workspace } from '@/types'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

export const navigation: Record<Workspace, NavItem[]> = {
  student: [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Discover', to: '/discover', icon: Compass },
    { label: 'My Organizations', to: '/my-organizations', icon: Users },
    { label: 'My Events', to: '/events', icon: CalendarDays },
    { label: 'Check in', to: '/check-in', icon: QrCode },
    { label: 'Attendance & Clearance', to: '/clearance', icon: ShieldCheck },
    { label: 'Applications', to: '/applications', icon: FileText },
    { label: 'Announcements', to: '/announcements', icon: Megaphone },
  ],
  officer: [
    { label: 'Overview', to: '/officer', icon: LayoutDashboard, end: true },
    { label: 'Membership', to: '/officer/applications', icon: UserPlus },
    { label: 'Members', to: '/officer/members', icon: Users },
    { label: 'Events', to: '/officer/events', icon: CalendarDays },
    { label: 'Attendance', to: '/officer/attendance', icon: ClipboardCheck },
    { label: 'Excuses', to: '/officer/excuses', icon: FileCheck2 },
    { label: 'Announcements', to: '/officer/announcements', icon: Megaphone },
    { label: 'Organization', to: '/officer/organization', icon: Settings2 },
  ],
  adviser: [
    { label: 'Oversight', to: '/adviser', icon: LayoutDashboard, end: true },
    { label: 'Organizations', to: '/adviser/organizations', icon: Users },
    { label: 'Event approvals', to: '/adviser/events', icon: CalendarCheck2 },
    { label: 'Attendance', to: '/adviser/attendance', icon: ClipboardCheck },
    { label: 'Students', to: '/adviser/students', icon: GraduationCap },
    { label: 'Announcements', to: '/adviser/announcements', icon: Megaphone },
    { label: 'Reports', to: '/adviser/reports', icon: BarChart3 },
  ],
}

/** Bottom navigation for students on phones. */
export const studentMobileNav: NavItem[] = [
  { label: 'Home', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Discover', to: '/discover', icon: Compass },
  { label: 'Check in', to: '/check-in', icon: QrCode },
  { label: 'Events', to: '/events', icon: CalendarDays },
  { label: 'Clearance', to: '/clearance', icon: ShieldCheck },
]

export const workspaceLabels: Record<Workspace, string> = {
  student: 'Student',
  officer: 'Organization Officer',
  adviser: 'Faculty Adviser · OSA',
}
