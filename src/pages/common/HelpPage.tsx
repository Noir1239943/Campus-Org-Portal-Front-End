import { useState } from 'react'
import { ChevronDown, LifeBuoy, Mail } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/Misc'
import { useAuth } from '@/context/AuthContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/cn'

const studentFaqs = [
  {
    q: 'How do I join an organization?',
    a: 'Go to Discover, open the organization and tap "Join organization". Answer the short form and submit. You can follow the status under Applications — officers usually reply within 5 school days.',
  },
  {
    q: 'How do I check in at an event?',
    a: 'At the venue, scan the QR code on the officer’s screen with your phone camera and tap the link. If scanning doesn’t work, open "Check in" in the menu and type the 6-character code. The code changes every minute, so screenshots shared in group chats won’t work.',
  },
  {
    q: 'I have no phone or no data. What do I do?',
    a: 'Show your school ID to an officer at the entrance. They can mark you as a walk-in using your ID number — it counts the same as scanning.',
  },
  {
    q: 'What does "Required" mean on an event?',
    a: 'Required (mandatory) events count toward your semester clearance for that organization. Members don’t need to register — just check in.',
  },
  {
    q: 'I missed a required event. Will I fail clearance?',
    a: 'Not if you had a valid reason. Open "Attendance & Clearance" and tap "File excuse" within 7 days of the event. If the officers approve it, it no longer counts against you. For older absences, talk to the officers directly.',
  },
  {
    q: 'Where do I see my service hours?',
    a: 'On your Dashboard and the Attendance & Clearance page. Hours are added automatically when you check in to events that give service hours.',
  },
  {
    q: 'I forgot my password.',
    a: 'Tap "Forgot password?" on the sign-in page to notify the OSA, then visit the office with your school ID. You will receive a temporary password — change it from your Profile page right away.',
  },
]

const officerFaqs = [
  {
    q: 'How do I take attendance?',
    a: 'Open Attendance, choose the event and tap "Open check-in". Show the QR (use "Display" for a projector or TV). Add walk-ins by ID number, and fix any record from the roster. Export the roster as CSV anytime.',
  },
  {
    q: 'Why is my event "For approval"?',
    a: 'Events are reviewed by the Office of Student Affairs before students can see them. If it is returned, read the note, edit the event and submit again.',
  },
  {
    q: 'A member is flagged "At risk". What should I do?',
    a: 'Their attendance in your organization is below 70%. Reach out early — they may have a schedule conflict or need help before clearance week.',
  },
]

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-slate-100 last:border-0">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-4 py-4 text-left" aria-expanded={open}>
        <span className="text-sm font-medium text-slate-900">{q}</span>
        <ChevronDown className={cn('size-4 shrink-0 text-slate-400 transition', open && 'rotate-180')} />
      </button>
      {open && <p className="-mt-1 pb-4 text-sm leading-relaxed text-slate-600">{a}</p>}
    </div>
  )
}

export default function HelpPage() {
  useDocumentTitle('Help')
  const { campus, workspaces } = useAuth()
  const isOfficer = workspaces.includes('officer') || workspaces.includes('adviser')

  return (
    <>
      <PageHeader eyebrow="Help & resources" title="How can we help?" description="Quick answers about organizations, events, check-in and clearance." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardBody className="py-1">
              <h2 className="pt-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">For students</h2>
              {studentFaqs.map((f) => (
                <Faq key={f.q} {...f} />
              ))}
            </CardBody>
          </Card>
          {isOfficer && (
            <Card>
              <CardBody className="py-1">
                <h2 className="pt-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">For officers</h2>
                {officerFaqs.map((f) => (
                  <Faq key={f.q} {...f} />
                ))}
              </CardBody>
            </Card>
          )}
        </div>

        <Card className="h-fit">
          <CardBody>
            <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <LifeBuoy className="size-5" />
            </span>
            <h2 className="mt-4 text-sm font-semibold text-slate-900">Still need help?</h2>
            <p className="mt-1 text-sm text-slate-500">Visit the Office of Student Affairs during office hours, or send an email.</p>
            {campus && (
              <a href={`mailto:${campus.osa_email}`} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline">
                <Mail className="size-4" /> {campus.osa_email}
              </a>
            )}
            <p className="mt-4 text-xs text-slate-400">
              {campus?.school_name} · {campus?.location}
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
