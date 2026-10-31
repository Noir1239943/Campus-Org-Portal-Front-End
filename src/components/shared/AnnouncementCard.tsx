import type { ReactNode } from 'react'
import { Megaphone, Pin } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { OrgMark } from '@/components/ui/Misc'
import { cn } from '@/lib/cn'
import { relativeTime } from '@/lib/format'
import type { Announcement } from '@/types'

export function AnnouncementCard({ announcement, actions, compact }: { announcement: Announcement; actions?: ReactNode; compact?: boolean }) {
  const org = announcement.organization

  return (
    <article className={cn('flex gap-3', !compact && 'rounded-2xl border border-slate-200/80 bg-white p-5')}>
      {org ? (
        <OrgMark acronym={org.acronym} color={org.color} size={compact ? 'sm' : 'md'} />
      ) : (
        <span className={cn('grid shrink-0 place-items-center rounded-xl bg-navy-900 text-white', compact ? 'size-8' : 'size-10')}>
          <Megaphone className="size-4" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className="text-sm font-semibold text-slate-900">{announcement.title}</h3>
          {announcement.is_pinned && (
            <Badge tone="blue">
              <Pin className="size-3" /> Pinned
            </Badge>
          )}
          {announcement.audience === 'members' && org && <Badge>Members</Badge>}
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          {org ? org.name : 'Office of Student Affairs'}
          {announcement.author && ` · ${announcement.author.name}`} · {relativeTime(announcement.published_at)}
        </p>
        <p className={cn('mt-2 text-sm whitespace-pre-line text-slate-600', compact && 'line-clamp-2')}>{announcement.body}</p>
        {actions && <div className="mt-3 flex gap-2">{actions}</div>}
      </div>
    </article>
  )
}
