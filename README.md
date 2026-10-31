# CPC Campus Organizations — Web (React + TypeScript + Tailwind)

Frontend for the **Cordova Public College Campus Organizations** portal. It talks to the Laravel
API in the separate `cpc-orgs-backend` repo.

| | |
|---|---|
| Stack | React 19 · TypeScript · Vite · Tailwind CSS v4 |
| Data | TanStack Query + Axios |
| Routing | React Router (pages are lazy-loaded so phones download less) |
| Hosting | **Vercel** |

## Pages

**Public:** Log in (ID number or email, with the CPC seal) · Forgot password · 404

**Student:** Dashboard · Discover organizations · Organization profile · Apply · My organizations ·
My events (schedule / browse / past) · Event details (register, add to calendar, file excuse) ·
Applications + status tracker · **Check in** (QR link or 6-character code) · **Attendance & Clearance** ·
Announcements

**Officer:** Overview · Membership applications · Members (attendance, at-risk, CSV export, add by ID) ·
Events (create / edit / submit for approval / cancel) · Attendance list · **Live attendance with rotating QR**
(fullscreen display for a projector, walk-ins, manual corrections) · Excuse requests · Announcements ·
Organization profile settings

**Adviser / OSA:** Oversight dashboard · Organizations + health · Organization detail (change status) ·
Event approvals · Attendance across organizations · Student lookup (participation, clearance,
temporary password) · Campus announcements · CSV reports

**Everyone:** Notifications · Profile & password · Help & resources

Students on phones get a bottom tab bar with a big **Check in** button.

## Run it locally

Requirements: Node.js 20+ and the API running (see the backend README).

```bash
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:8000
npm run dev                 # http://localhost:5173
```

Demo accounts (password `password123`): student `2024-00145`, officer `0002`, OSA `Admin` (or `osa@cpc.edu.ph`).

Other scripts: `npm run build` (type-check + production build) · `npm run preview` · `npm run lint`

## Deploy on Vercel

1. Push this folder to its own GitHub repo (e.g. `cpc-orgs-frontend`).
2. Vercel → **Add New → Project** → import the repo. Framework preset: **Vite** (auto-detected).
3. Environment variables:
   - `VITE_API_URL` = your Render API URL, e.g. `https://cpc-orgs-api.onrender.com` (no `/api`, no trailing slash)
   - `VITE_SHOW_DEMO_ACCOUNTS` = `true` for presentations, `false` for real use
4. Deploy. `vercel.json` already sends every route to `index.html`, so refreshing `/dashboard` works.
5. Copy the Vercel URL into the API's `FRONTEND_URL` on Render (needed for CORS and the QR check-in link), then redeploy the API.

## Folder structure

```
src/
  api/            Axios client + one file per area (auth, student, officer, adviser, notifications)
  components/
    layout/       AppLayout, Sidebar (workspace switcher), Topbar, NotificationBell, AuthLayout, navigation
    shared/       EventListItem, OrganizationCard, ExcuseModal, ReviewModal, AnnouncementCard/Manager, MonthlyBarChart
    ui/           Button, Card, Badge, Field inputs, Modal, StatCard, Tabs, feedback states…
  context/        AuthContext (session, workspace, selected organization), workspace routes
  hooks/          useDebounce, useDocumentTitle
  lib/            date formatting, status labels/colors, calendar (.ics), class names
  pages/
    auth/         LoginPage, ForgotPasswordPage
    student/      DashboardPage, DiscoverPage, OrganizationPage, ApplyPage, MyOrganizationsPage, EventsPage,
                  EventDetailPage, ApplicationsPage, ApplicationDetailPage, CheckInPage, ClearancePage, AnnouncementsPage
    officer/      OverviewPage, ApplicationsPage, MembersPage, EventsPage, EventFormPage, AttendanceListPage,
                  EventAttendancePage, ExcusesPage, AnnouncementsPage, OrganizationSettingsPage
    adviser/      OversightPage, OrganizationsPage, OrganizationDetailPage, EventApprovalsPage, AttendancePage,
                  StudentsPage, AnnouncementsPage, ReportsPage
    common/       NotificationsPage, ProfilePage, HelpPage, NotFoundPage
  routes/         AppRouter (all routes), guards (login + workspace)
  types/          TypeScript types matching the API
public/           cpc-logo.png, favicon.png
```

## How QR check-in works

1. The officer opens check-in on the event's attendance page. A QR and a 6-character code appear.
2. The code changes every minute (a screenshot shared in a group chat stops working quickly).
3. A student scans the QR with the phone camera → it opens `/check-in?event=…&code=…` and checks them in automatically
   (or they type the code on the Check in page).
4. Arriving more than 15 minutes after the start is recorded as **Late**. Students without a phone are added as walk-ins by ID number.
