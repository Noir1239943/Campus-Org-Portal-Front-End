import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bookmark, CalendarCheck2, CalendarDays, CheckCircle2, ChevronRight, Clock, ExternalLink, FileClock, Mail, UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api/client'
import { studentApi } from '@/api/student'
import { AnnouncementCard } from '@/components/shared/AnnouncementCard'
import { EventListItem } from '@/components/shared/EventListItem'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/Feedback'
import { Avatar, OrgMark, ProgressBar } from '@/components/ui/Misc'
import { StatCard } from '@/components/ui/StatCard'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { categoryTone } from '@/lib/status'
import type { Organization } from '@/types'

function JoinButton({ organization, light }: { organization: Organization; light?: boolean }) {
  const viewer = organization.viewer

  if (viewer?.membership) {
    return (
      <span className={cn('inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-medium', light ? 'bg-white/15 text-white' : 'bg-emerald-50 text-emerald-700')}>
        <CheckCircle2 className="size-4" /> {organization.requires_all_students || viewer.membership.position === 'Member' ? "You're a member" : `Member · ${viewer.membership.position}`}
      </span>
    )
  }

  if (viewer?.application?.status === 'pending') {
    return (
      <Button to={`/applications/${viewer.application.id}`} variant={light ? 'secondary' : 'subtle'} icon={<FileClock className="size-4" />}>
        Application under review
      </Button>
    )
  }

  if (organization.is_open_for_applications) {
    return (
      <Button to={`/organizations/${organization.slug}/apply`} icon={<UserPlus className="size-4" />}>
        Join organization
      </Button>
    )
  }

  return (
    <Button disabled variant="secondary">
      Not accepting members
    </Button>
  )
}

export default function OrganizationPage() {
  const { slug = '' } = useParams()
  const queryClient = useQueryClient()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['student', 'organization', slug],
    queryFn: () => studentApi.organization(slug),
  })
  useDocumentTitle(data?.organization.name ?? 'Organization')

  const save = useMutation({
    mutationFn: () => studentApi.toggleSave(slug),
    onSuccess: (res) => {
      toast.success(res.saved ? 'Saved to your list' : 'Removed from saved')
      queryClient.invalidateQueries({ queryKey: ['student'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  if (isLoading) return <PageLoader />
  if (error || !data) return <ErrorState error={error} onRetry={refetch} />

  const { organization: org, upcoming_events, officers, announcements } = data
  const members = org.members_count ?? 0

  return (
    <>
      <nav className="mb-4 flex items-center gap-1 text-xs text-slate-500" aria-label="Breadcrumb">
        <Link to="/discover" className="hover:text-blue-600">
          Organizations
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-slate-700">{org.name}</span>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-navy-900 p-6 text-white sm:p-8" style={{ backgroundImage: `radial-gradient(circle at 85% 15%, ${org.color}66, transparent 55%)` }}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-4">
            <OrgMark acronym={org.acronym} color="#ffffff" size="lg" />
            <div className="min-w-0">
              <Badge tone={categoryTone[org.category] ?? 'gray'}>{org.category}</Badge>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{org.name}</h1>
              {org.tagline && <p className="mt-1 text-sm text-blue-100/80">{org.tagline}</p>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <JoinButton organization={org} light />
            <Button
              variant="secondary"
              loading={save.isPending}
              onClick={() => save.mutate()}
              icon={<Bookmark className={cn('size-4', org.viewer?.is_saved && 'fill-current text-blue-600')} />}
            >
              {org.viewer?.is_saved ? 'Saved' : 'Save'}
            </Button>
          </div>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Members" value={members} hint={org.new_members_count ? `${org.new_members_count} new this term` : undefined} icon={<Users />} />
        <StatCard label="Upcoming events" value={org.upcoming_events_count ?? 0} hint={upcoming_events[0] ? `Next: ${formatDate(upcoming_events[0].starts_at, { month: 'short', day: 'numeric' })}` : 'Nothing scheduled yet'} icon={<CalendarDays />} tone="violet" />
        <StatCard label="Completed events" value={org.events_count ?? 0} hint="This academic year" icon={<CalendarCheck2 />} tone="green" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="About the organization" />
            <CardBody>
              <p className="text-sm leading-relaxed whitespace-pre-line text-slate-600">{org.about || org.description}</p>
              {org.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {org.tags.map((tag) => (
                    <Badge key={tag} tone="blue">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Upcoming events" subtitle={`${upcoming_events.length} scheduled`} />
            <CardBody className="divide-y divide-slate-100 pt-2">
              {upcoming_events.length ? (
                upcoming_events.map((event) => (
                  <EventListItem
                    key={event.id}
                    event={event}
                    showOrganization={false}
                    to={`/events/${event.id}`}
                    right={event.viewer?.can_register && !event.viewer.mandatory_for_me ? <Badge tone="blue">Registration open</Badge> : undefined}
                  />
                ))
              ) : (
                <EmptyState icon={<CalendarDays />} title="No upcoming events" description="Save this organization to keep an eye on new events." />
              )}
            </CardBody>
          </Card>

          {announcements.length > 0 && (
            <Card>
              <CardHeader title="Announcements" />
              <CardBody className="space-y-5">
                {announcements.map((a) => (
                  <AnnouncementCard key={a.id} announcement={a} compact />
                ))}
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Membership" subtitle={org.application_deadline && !org.requires_all_students ? `Applications close ${formatDate(org.application_deadline, { month: 'long', day: 'numeric' })}` : undefined} />
            <CardBody>
              {org.requires_all_students ? (
                <p className="text-sm text-slate-600">Every enrolled CPC student is automatically a member. Required assemblies count toward your semester clearance.</p>
              ) : (
                <>
                  {org.capacity && (
                    <>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Available places</span>
                        <span className="font-medium text-slate-700">
                          {Math.max(0, org.capacity - members)} of {org.capacity}
                        </span>
                      </div>
                      <ProgressBar value={members} max={org.capacity} className="mt-2" />
                    </>
                  )}
                  <p className="mt-3 text-xs text-slate-500">Open to all enrolled students. No experience required unless stated in the application.</p>
                  <div className="mt-4">
                    <JoinButton organization={org} />
                  </div>
                </>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Contact & leadership" />
            <CardBody className="space-y-3">
              {officers.map((o) => (
                <div key={`${o.name}-${o.position}`} className="flex items-center gap-3">
                  <Avatar initials={o.initials} name={o.name} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{o.name}</p>
                    <p className="text-xs text-slate-500">{o.position}</p>
                  </div>
                </div>
              ))}
              {org.adviser_name && (
                <div className="flex items-center gap-3">
                  <Avatar initials={org.adviser_name.replace(/^(Prof\.|Dr\.|Mr\.|Ms\.|Engr\.|Chef|Coach)\s*/, '').split(' ').map((p) => p[0]).slice(0, 2).join('')} name={org.adviser_name} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{org.adviser_name}</p>
                    <p className="text-xs text-slate-500">Faculty Adviser</p>
                  </div>
                </div>
              )}
              <div className="space-y-2 border-t border-slate-100 pt-3 text-sm">
                {org.meeting_schedule && (
                  <p className="flex items-start gap-2 text-slate-600">
                    <Clock className="mt-0.5 size-4 shrink-0 text-slate-400" /> {org.meeting_schedule}
                  </p>
                )}
                {org.contact_email && (
                  <a href={`mailto:${org.contact_email}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                    <Mail className="size-4 shrink-0" /> {org.contact_email}
                  </a>
                )}
                {org.facebook_url && (
                  <a href={org.facebook_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                    <ExternalLink className="size-4 shrink-0" /> Facebook page
                  </a>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}
