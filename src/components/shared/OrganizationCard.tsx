import { Link } from 'react-router-dom'
import { ArrowRight, Bookmark, CalendarDays, Users } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { OrgMark } from '@/components/ui/Misc'
import { cn } from '@/lib/cn'
import { categoryTone } from '@/lib/status'
import type { Organization } from '@/types'

function MembershipBadge({ organization }: { organization: Organization }) {
  const viewer = organization.viewer

  if (viewer?.membership) return <Badge tone="blue">{viewer.membership.position}</Badge>
  if (viewer?.application?.status === 'pending') return <Badge tone="amber">Application pending</Badge>
  if (organization.requires_all_students) return <Badge tone="navy">All students</Badge>
  if (organization.is_open_for_applications) return <Badge tone="green">Accepting members</Badge>
  return <Badge>Not accepting</Badge>
}

export function OrganizationCard({ organization, onToggleSave }: { organization: Organization; onToggleSave?: (org: Organization) => void }) {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start gap-3">
        <OrgMark acronym={organization.acronym} color={organization.color} />
        <div className="min-w-0 flex-1">
          <Badge tone={categoryTone[organization.category] ?? 'gray'}>{organization.category}</Badge>
          <h3 className="mt-1.5 text-[15px] leading-snug font-semibold text-slate-900">
            <Link to={`/organizations/${organization.slug}`} className="after:absolute after:inset-0">
              {organization.name}
            </Link>
          </h3>
        </div>
        {onToggleSave && (
          <button
            onClick={() => onToggleSave(organization)}
            className={cn(
              'relative z-10 -m-1 rounded-lg p-1.5 hover:bg-slate-100',
              organization.viewer?.is_saved ? 'text-blue-600' : 'text-slate-300 hover:text-slate-500',
            )}
            aria-label={organization.viewer?.is_saved ? `Remove ${organization.name} from saved` : `Save ${organization.name}`}
            aria-pressed={organization.viewer?.is_saved}
          >
            <Bookmark className={cn('size-4', organization.viewer?.is_saved && 'fill-current')} />
          </button>
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-slate-500">{organization.description}</p>

      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Users className="size-3.5" /> {organization.members_count ?? 0} members
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="size-3.5" /> {organization.upcoming_events_count ?? 0} upcoming
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <MembershipBadge organization={organization} />
        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">
          View details <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </div>
  )
}
