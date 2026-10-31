import type { ReactNode } from 'react'
import { CalendarCheck2, QrCode, ShieldCheck, Users } from 'lucide-react'

const highlights = [
  { icon: Users, title: 'Find your organization', text: 'Browse every recognized CPC organization and apply online — no more paper forms.' },
  { icon: QrCode, title: 'Check in with your phone', text: 'Scan the event QR. Your attendance is recorded instantly — no sign-in sheet to lose.' },
  { icon: ShieldCheck, title: 'Know your clearance early', text: 'See missed required events and file excuses before clearance week.' },
  { icon: CalendarCheck2, title: 'Never miss an event', text: 'Announcements and schedules from all your organizations in one place.' },
]

/** Two-column layout for login & forgot password: school panel + form. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-navy-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 size-96 rounded-full bg-cpc-red/10 blur-3xl" />

        <div className="relative flex items-center gap-4">
          <img src="/cpc-logo.png" alt="" className="size-14 rounded-full bg-white p-0.5" />
          <div>
            <p className="text-lg font-semibold text-white">Cordova Public College</p>
            <p className="text-xs font-medium tracking-wider text-blue-200/80 uppercase">Campus Organizations Portal</p>
          </div>
        </div>

        <div className="relative max-w-lg">
          <h2 className="text-3xl leading-tight font-semibold text-white">Everything about your student organizations, in one place.</h2>
          <ul className="mt-8 space-y-5">
            {highlights.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.08] text-blue-200 ring-1 ring-white/10">
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">{title}</span>
                  <span className="mt-0.5 block text-sm text-blue-100/70">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center justify-between text-xs text-blue-100/60">
          <span className="italic">Servire Populum</span>
          <div className="flex h-1 w-24 overflow-hidden rounded-full" aria-hidden>
            <span className="flex-1 bg-navy-700" />
            <span className="flex-1 bg-cpc-red" />
            <span className="flex-1 bg-cpc-gold" />
          </div>
        </div>
      </aside>

      <main className="flex items-center justify-center bg-white px-5 py-10 sm:px-10">{children}</main>
    </div>
  )
}
