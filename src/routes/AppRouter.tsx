import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageLoader } from '@/components/ui/Feedback'
import { HomeRedirect, RequireAuth, RequireWorkspace } from './guards'

/* Pages are loaded on demand so phones on mobile data download less. */

// Auth
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))

// Student
const DashboardPage = lazy(() => import('@/pages/student/DashboardPage'))
const DiscoverPage = lazy(() => import('@/pages/student/DiscoverPage'))
const OrganizationPage = lazy(() => import('@/pages/student/OrganizationPage'))
const ApplyPage = lazy(() => import('@/pages/student/ApplyPage'))
const MyOrganizationsPage = lazy(() => import('@/pages/student/MyOrganizationsPage'))
const EventsPage = lazy(() => import('@/pages/student/EventsPage'))
const EventDetailPage = lazy(() => import('@/pages/student/EventDetailPage'))
const ApplicationsPage = lazy(() => import('@/pages/student/ApplicationsPage'))
const ApplicationDetailPage = lazy(() => import('@/pages/student/ApplicationDetailPage'))
const ProposeOrganizationPage = lazy(() => import('@/pages/student/ProposeOrganizationPage'))
const CheckInPage = lazy(() => import('@/pages/student/CheckInPage'))
const ClearancePage = lazy(() => import('@/pages/student/ClearancePage'))
const AnnouncementsPage = lazy(() => import('@/pages/student/AnnouncementsPage'))

// Officer
const OfficerOverviewPage = lazy(() => import('@/pages/officer/OverviewPage'))
const OfficerApplicationsPage = lazy(() => import('@/pages/officer/ApplicationsPage'))
const MembersPage = lazy(() => import('@/pages/officer/MembersPage'))
const OfficerEventsPage = lazy(() => import('@/pages/officer/EventsPage'))
const EventFormPage = lazy(() => import('@/pages/officer/EventFormPage'))
const AttendanceListPage = lazy(() => import('@/pages/officer/AttendanceListPage'))
const EventAttendancePage = lazy(() => import('@/pages/officer/EventAttendancePage'))
const ExcusesPage = lazy(() => import('@/pages/officer/ExcusesPage'))
const OfficerAnnouncementsPage = lazy(() => import('@/pages/officer/AnnouncementsPage'))
const OrganizationSettingsPage = lazy(() => import('@/pages/officer/OrganizationSettingsPage'))

// Adviser / OSA
const OversightPage = lazy(() => import('@/pages/adviser/OversightPage'))
const AdviserOrganizationsPage = lazy(() => import('@/pages/adviser/OrganizationsPage'))
const AdviserOrganizationDetailPage = lazy(() => import('@/pages/adviser/OrganizationDetailPage'))
const OrganizationFormPage = lazy(() => import('@/pages/adviser/OrganizationFormPage'))
const ProposalsPage = lazy(() => import('@/pages/adviser/ProposalsPage'))
const EventApprovalsPage = lazy(() => import('@/pages/adviser/EventApprovalsPage'))
const AdviserAttendancePage = lazy(() => import('@/pages/adviser/AttendancePage'))
const StudentsPage = lazy(() => import('@/pages/adviser/StudentsPage'))
const AdviserAnnouncementsPage = lazy(() => import('@/pages/adviser/AnnouncementsPage'))
const ReportsPage = lazy(() => import('@/pages/adviser/ReportsPage'))

// Shared
const NotificationsPage = lazy(() => import('@/pages/common/NotificationsPage'))
const ProfilePage = lazy(() => import('@/pages/common/ProfilePage'))
const HelpPage = lazy(() => import('@/pages/common/HelpPage'))
const NotFoundPage = lazy(() => import('@/pages/common/NotFoundPage'))

const page = (element: ReactNode) => <Suspense fallback={<PageLoader />}>{element}</Suspense>

function Workspace({ name }: { name: 'student' | 'officer' | 'adviser' }) {
  return (
    <RequireWorkspace workspace={name}>
      <Outlet />
    </RequireWorkspace>
  )
}

const router = createBrowserRouter([
  { path: '/login', element: page(<LoginPage />) },
  { path: '/register', element: page(<RegisterPage />) },
  { path: '/forgot-password', element: page(<ForgotPasswordPage />) },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <HomeRedirect /> },

      {
        element: <Workspace name="student" />,
        children: [
          { path: 'dashboard', element: page(<DashboardPage />) },
          { path: 'discover', element: page(<DiscoverPage />) },
          { path: 'organizations/:slug', element: page(<OrganizationPage />) },
          { path: 'organizations/:slug/apply', element: page(<ApplyPage />) },
          { path: 'my-organizations', element: page(<MyOrganizationsPage />) },
          { path: 'events', element: page(<EventsPage />) },
          { path: 'events/:id', element: page(<EventDetailPage />) },
          { path: 'applications', element: page(<ApplicationsPage />) },
          { path: 'applications/:id', element: page(<ApplicationDetailPage />) },
          { path: 'propose-organization', element: page(<ProposeOrganizationPage />) },
          { path: 'check-in', element: page(<CheckInPage />) },
          { path: 'clearance', element: page(<ClearancePage />) },
          { path: 'announcements', element: page(<AnnouncementsPage />) },
        ],
      },

      {
        path: 'officer',
        element: <Workspace name="officer" />,
        children: [
          { index: true, element: page(<OfficerOverviewPage />) },
          { path: 'applications', element: page(<OfficerApplicationsPage />) },
          { path: 'members', element: page(<MembersPage />) },
          { path: 'events', element: page(<OfficerEventsPage />) },
          { path: 'events/new', element: page(<EventFormPage />) },
          { path: 'events/:id/edit', element: page(<EventFormPage />) },
          { path: 'events/:id/attendance', element: page(<EventAttendancePage />) },
          { path: 'attendance', element: page(<AttendanceListPage />) },
          { path: 'excuses', element: page(<ExcusesPage />) },
          { path: 'announcements', element: page(<OfficerAnnouncementsPage />) },
          { path: 'organization', element: page(<OrganizationSettingsPage />) },
        ],
      },

      {
        path: 'adviser',
        element: <Workspace name="adviser" />,
        children: [
          { index: true, element: page(<OversightPage />) },
          { path: 'organizations', element: page(<AdviserOrganizationsPage />) },
          { path: 'organizations/new', element: page(<OrganizationFormPage />) },
          { path: 'organizations/:id', element: page(<AdviserOrganizationDetailPage />) },
          { path: 'organizations/:id/edit', element: page(<OrganizationFormPage />) },
          { path: 'proposals', element: page(<ProposalsPage />) },
          { path: 'events', element: page(<EventApprovalsPage />) },
          { path: 'attendance', element: page(<AdviserAttendancePage />) },
          { path: 'students', element: page(<StudentsPage />) },
          { path: 'announcements', element: page(<AdviserAnnouncementsPage />) },
          { path: 'reports', element: page(<ReportsPage />) },
        ],
      },

      { path: 'notifications', element: page(<NotificationsPage />) },
      { path: 'profile', element: page(<ProfilePage />) },
      { path: 'help', element: page(<HelpPage />) },
      { path: '*', element: page(<NotFoundPage />) },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
