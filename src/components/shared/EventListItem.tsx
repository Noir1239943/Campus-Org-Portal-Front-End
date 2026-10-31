import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Clock, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { DateTile } from '@/components/ui/Misc'
import { cn } from '@/lib/cn'
import { formatTimeRange } from '@/lib/format'
import { attendanceStatus } from '@/lib/status'
import type { CampusEvent } from '@/types'

interface EventListItemProps {
  event: CampusEvent
  to?: string
  right?: ReactNode
  showOrganization?: boolean
  highlight?: boolean
}

/** One event row: date tile, title, badges, time and venue. */
export function EventListItem({ event, to, right, showOrganization = true, highlight }: EventListItemProps) {
  const viewer = event.viewer

  const content = (
    <>
      <DateTile iso={event.starts_at} highlight={highlight} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-slate-900">{event.title}</p>
          {event.is_mandatory && <Badge tone="red">Required</Badge>}
          {viewer?.registered && !viewer.attendance_status && <Badge tone="green">Registered</Badge>}
          {viewer?.attendance_status && <Badge tone={attendanceStatus[viewer.attendance_status].tone}>{attendanceStatus[viewer.attendance_status].label}</Badge>}
          {event.check_in_open && <Badge tone="blue" dot>Check-in open</Badge>}
          {event.visibility === 'members' && !event.is_mandatory && <Badge>Members only</Badge>}
        </div>
        {showOrganization && event.organization && <p className="mt-0.5 truncate text-xs text-slate-500">{event.organization.name}</p>}
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {formatTimeRange(event.starts_at, event.ends_at)}
          </span>
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </span>
        </p>
      </div>
      {right ?? (to && <ChevronRight className="size-4 shrink-0 text-slate-300" />)}
    </>
  )

  const classes = 'flex items-center gap-3 sm:gap-4 py-3'

  return to ? (
    <Link to={to} className={cn(classes, 'group -mx-2 rounded-xl px-2 transition hover:bg-slate-50')}>
      {content}
    </Link>
  ) : (
    <div className={classes}>{content}</div>
  )
}
