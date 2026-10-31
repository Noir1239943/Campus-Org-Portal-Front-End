/** Builds a downloadable .ics file so students can add an event to their phone calendar. */
export function downloadIcs(event: { id: number; title: string; starts_at: string; ends_at: string; venue: string; description?: string | null; organization?: { name: string } }) {
  const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const escape = (text: string) => text.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cordova Public College//Campus Organizations//EN',
    'BEGIN:VEVENT',
    `UID:cpc-event-${event.id}@cpc.edu.ph`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(event.starts_at)}`,
    `DTEND:${stamp(event.ends_at)}`,
    `SUMMARY:${escape(event.title)}`,
    `LOCATION:${escape(event.venue)}`,
    `DESCRIPTION:${escape([event.organization?.name, event.description].filter(Boolean).join('\n\n'))}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escape(event.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${event.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.ics`
  a.click()
  URL.revokeObjectURL(url)
}
