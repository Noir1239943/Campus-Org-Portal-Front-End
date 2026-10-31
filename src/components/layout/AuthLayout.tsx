import { useState, type ReactNode } from 'react'
import { CalendarCheck2, QrCode, ShieldCheck, Users } from 'lucide-react'

const highlights = [
  { icon: Users, title: 'Find your organization', text: 'Browse every recognized CPC organization and apply online — no more paper forms.' },
  { icon: QrCode, title: 'Check in with your phone', text: 'Scan the event QR. Your attendance is recorded instantly — no sign-in sheet to lose.' },
  { icon: ShieldCheck, title: 'Know your clearance early', text: 'See missed required events and file excuses before clearance week.' },
  { icon: CalendarCheck2, title: 'Never miss an event', text: 'Announcements and schedules from all your organizations in one place.' },
]

const CYCLE_SECONDS = 20

/**
 * Two-column layout for the auth pages: branded showcase panel (logo + background
 * video + rotating highlights) on the left, the form on the right.
 * Drop a looping clip at /public/auth-bg.mp4 to enable the background video;
 * without it the animated gradient is shown.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  const [videoOk, setVideoOk] = useState(true)

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-navy-950 lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
        {videoOk && (
          <video
            className="absolute inset-0 size-full object-cover opacity-40"
            src="/auth-bg.mp4"
            autoPlay
            muted
            loop
            playsInline
            onError={() => setVideoOk(false)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900/90 via-navy-800/70 to-navy-950/95" />
        <div className="pointer-events-none absolute -top-32 -right-24 size-[28rem] animate-[auth-float_14s_ease-in-out_infinite] rounded-full bg-blue-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 size-[28rem] animate-[auth-float_18s_ease-in-out_infinite_reverse] rounded-full bg-cpc-red/20 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 left-1/3 size-72 animate-[auth-float_22s_ease-in-out_infinite] rounded-full bg-cpc-gold/10 blur-3xl" />

        <div className="relative flex flex-col items-center text-center">
          <img src="/cpc-logo.png" alt="Cordova Public College seal" className="size-44 rounded-full bg-white/95 p-1 shadow-2xl ring-8 ring-white/10" />
          <h2 className="mt-8 text-3xl font-semibold text-white">Cordova Public College</h2>
          <p className="mt-1 text-xs font-medium tracking-[0.25em] text-blue-200/80 uppercase">Campus Organizations Portal</p>

          <div className="relative mt-10 h-28 w-full max-w-md">
            {highlights.map(({ icon: Icon, title, text }, i) => (
              <div
                key={title}
                className="absolute inset-0 flex flex-col items-center opacity-0 motion-reduce:first:opacity-100"
                style={{ animation: `auth-slide ${CYCLE_SECONDS}s ease-in-out ${i * (CYCLE_SECONDS / highlights.length)}s infinite` }}
              >
                <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-blue-200 ring-1 ring-white/15">
                  <Icon className="size-5" />
                </span>
                <p className="mt-3 text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-sm text-blue-100/70">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute inset-x-12 bottom-8 flex items-center justify-between text-xs text-blue-100/60">
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
