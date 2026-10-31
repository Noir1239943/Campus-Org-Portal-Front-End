import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CalendarDays, Camera, Check, Clock, ExternalLink, KeyRound, LogOut, MapPin, MessageSquareText, QrCode, Smartphone } from 'lucide-react'
import { getErrorMessage } from '@/api/client'
import { studentApi } from '@/api/student'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Alert, Spinner } from '@/components/ui/Feedback'
import { Detail, PageHeader, ProgressBar } from '@/components/ui/Misc'
import { useAuth } from '@/context/AuthContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { firstName, formatDate, formatTime, formatTimeRange, percent } from '@/lib/format'
import { attendanceStatus } from '@/lib/status'
import type { CheckInResult } from '@/types'

function Success({ result }: { result: CheckInResult }) {
  const { user } = useAuth()
  const { event, attendance, summary } = result
  const status = attendanceStatus[attendance.status]

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardBody className="flex flex-col items-center px-6 py-10 text-center sm:px-10">
          <span className="grid size-16 place-items-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/50">
            <span className="grid size-11 place-items-center rounded-full bg-emerald-500 text-white">
              <Check className="size-6" strokeWidth={3} />
            </span>
          </span>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">{result.already_checked_in ? "You're already checked in" : 'Check-in confirmed'}</h2>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            {result.already_checked_in
              ? `No need to scan again, ${firstName(user?.first_name ?? '')}. Your attendance was recorded at ${formatTime(attendance.checked_in_at)}.`
              : `Welcome, ${firstName(user?.first_name ?? '')}. Your attendance was recorded successfully at ${formatTime(attendance.checked_in_at)}. Keep this page open until the event ends if officers ask to see it.`}
          </p>

          <div className="mt-8 w-full max-w-lg rounded-2xl border border-slate-200 bg-slate-50/60 p-5 text-left">
            <div className="flex items-center justify-between gap-2">
              <Badge tone={status.tone}>{status.label}</Badge>
              <span className="font-mono text-[11px] text-slate-400">Check-in ID · {attendance.reference}</span>
            </div>
            <p className="mt-3 text-lg font-semibold text-slate-900">{event.title}</p>
            {event.organization && <p className="text-xs text-slate-500">{event.organization.name}</p>}
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Detail icon={<CalendarDays />} label="Date">{formatDate(event.starts_at, { month: 'long', day: 'numeric', year: 'numeric' })}</Detail>
              <Detail icon={<Clock />} label="Time">{formatTimeRange(event.starts_at, event.ends_at)}</Detail>
              <Detail icon={<MapPin />} label="Location">{event.venue}</Detail>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button variant="secondary" to="/events" icon={<ArrowLeft className="size-4" />}>
              Back to my events
            </Button>
            <Button variant="secondary" to={`/events/${event.id}`} icon={<ExternalLink className="size-4" />}>
              View event details
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader title="During the event" subtitle={`Ends at ${formatTime(event.ends_at)}`} />
          <CardBody className="space-y-4">
            {[
              { icon: Smartphone, title: 'Keep your phone handy', text: 'An officer may ask to verify this confirmation.' },
              { icon: LogOut, title: "Don't leave early", text: 'Some events record a closing check before service hours are credited.' },
              { icon: MessageSquareText, title: 'Share your feedback', text: 'Tell the officers what to improve next time.' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                  <Icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-800">{title}</p>
                  <p className="text-xs text-slate-500">{text}</p>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className="border-blue-100 bg-blue-50/40">
          <CardHeader title="Your attendance" />
          <CardBody>
            <p className="text-3xl font-semibold tracking-tight text-slate-900">{percent(summary.rate)}</p>
            <ProgressBar value={summary.rate ?? 0} className="mt-3" />
            <p className="mt-3 text-xs text-slate-600">
              {summary.attended} of {summary.total - summary.excused} expected events attended this semester.{' '}
              <Link to="/clearance" className="font-medium text-blue-600">See clearance</Link>
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default function CheckInPage() {
  useDocumentTitle('Check in')
  const queryClient = useQueryClient()
  const [params] = useSearchParams()
  const eventParam = Number(params.get('event')) || undefined
  const codeParam = params.get('code') ?? ''
  const [code, setCode] = useState('')
  const autoSubmitted = useRef(false)

  const checkIn = useMutation({
    mutationFn: (payload: { code: string; event_id?: number; via: 'qr' | 'code' }) => studentApi.checkIn(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['student'] }),
  })

  // Opened from the QR → check in automatically.
  useEffect(() => {
    if (codeParam && !autoSubmitted.current) {
      autoSubmitted.current = true
      checkIn.mutate({ code: codeParam, event_id: eventParam, via: 'qr' })
    }
  }, [codeParam, eventParam, checkIn])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    checkIn.mutate({ code, event_id: eventParam, via: 'code' })
  }

  return (
    <>
      <PageHeader eyebrow="Event check-in" title={checkIn.data ? "You're checked in" : 'Check in to an event'} description={checkIn.data ? 'Your attendance has been recorded.' : 'Scan the QR code at the venue or type the 6-character code shown on the officer’s screen.'} />

      {checkIn.data ? (
        <Success result={checkIn.data} />
      ) : checkIn.isPending && codeParam ? (
        <Card>
          <CardBody className="flex flex-col items-center py-16 text-center">
            <Spinner className="size-8" />
            <p className="mt-4 text-sm font-medium text-slate-700">Recording your attendance…</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardBody className="sm:p-8">
              <form onSubmit={submit} className="mx-auto max-w-sm text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                  <KeyRound className="size-6" />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-slate-900">Enter check-in code</h2>
                <p className="mt-1 text-sm text-slate-500">The code changes every minute, so use the one on screen right now.</p>

                {checkIn.error && (
                  <Alert tone="danger" className="mt-4 text-left">
                    {getErrorMessage(checkIn.error)}
                  </Alert>
                )}

                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                  placeholder="ABC123"
                  className="mt-6 h-16 w-full rounded-xl border-0 text-center font-mono text-3xl font-semibold tracking-[0.4em] text-slate-900 uppercase ring-1 ring-slate-200 ring-inset placeholder:text-slate-300 focus:ring-2 focus:ring-blue-600"
                  autoComplete="off"
                  autoCapitalize="characters"
                  inputMode="text"
                  aria-label="Check-in code"
                  autoFocus
                />
                <Button type="submit" size="lg" className="mt-4 w-full" loading={checkIn.isPending} disabled={code.length < 6}>
                  Check in
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader title="Faster: scan the QR" />
            <CardBody className="space-y-4">
              {[
                { icon: Camera, text: 'Open your phone camera (or Google Lens) and point it at the QR on the officer’s screen.' },
                { icon: QrCode, text: 'Tap the link that appears. This page opens and checks you in automatically.' },
                { icon: Check, text: 'Wait for the green “Check-in confirmed” screen. That’s it — no sign-in sheet.' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
                    <Icon className="size-4" />
                  </span>
                  <p className="pt-1 text-sm text-slate-600">{text}</p>
                </div>
              ))}
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Arriving more than 15 minutes after the start is recorded as <strong>Late</strong>. Codes shared in group chats expire within a minute.
              </p>
            </CardBody>
          </Card>
        </div>
      )}
    </>
  )
}
