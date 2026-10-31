/* Date and number formatting (Philippine English). */

const locale = 'en-PH'

export function formatDate(iso: string | null | undefined, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(locale, options)
}

export function formatLongDate(iso: string | null | undefined) {
  return formatDate(iso, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export function formatTime(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—'
  return `${formatDate(iso, { month: 'short', day: 'numeric' })} · ${formatTime(iso)}`
}

/** "2:00 – 4:00 PM" */
export function formatTimeRange(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const sameMeridiem = s.getHours() < 12 === e.getHours() < 12
  const startText = s.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })
  const endText = e.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })

  return sameMeridiem ? `${startText.replace(/\s?[AP]M$/i, '')} – ${endText}` : `${startText} – ${endText}`
}

export function monthShort(iso: string) {
  return new Date(iso).toLocaleDateString(locale, { month: 'short' }).toUpperCase()
}

export function dayOfMonth(iso: string) {
  return new Date(iso).getDate()
}

export function relativeTime(iso: string | null | undefined) {
  if (!iso) return ''
  const diff = (new Date(iso).getTime() - Date.now()) / 1000
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const abs = Math.abs(diff)

  if (abs < 60) return 'just now'
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  if (abs < 86400 * 7) return rtf.format(Math.round(diff / 86400), 'day')
  return formatDate(iso)
}

/** "in 3 days", "tomorrow", "today" for upcoming events */
export function daysUntil(iso: string) {
  const start = new Date(iso)
  const today = new Date()
  start.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  const days = Math.round((start.getTime() - today.getTime()) / 86400000)

  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days > 1) return `In ${days} days`
  if (days === -1) return 'Yesterday'
  return `${Math.abs(days)} days ago`
}

export function plural(count: number, word: string, pluralWord = `${word}s`) {
  return `${count} ${count === 1 ? word : pluralWord}`
}

export function percent(value: number | null | undefined) {
  return value === null || value === undefined ? '—' : `${Math.round(value)}%`
}

export function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/** Value for <input type="date"> from an ISO string (local time). */
export function toDateInput(iso: string | null | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Value for <input type="time"> from an ISO string (local time). */
export function toTimeInput(iso: string | null | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Combine date + time inputs into an ISO string (sent to the API). */
export function combineDateTime(date: string, time: string) {
  return new Date(`${date}T${time || '00:00'}`).toISOString()
}

export function firstName(name: string) {
  return name.split(' ')[0]
}
