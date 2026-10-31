import { officerApi } from '@/api/officer'
import { AnnouncementManager } from '@/components/shared/AnnouncementManager'
import { useAuth } from '@/context/AuthContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function OfficerAnnouncementsPage() {
  useDocumentTitle('Announcements')
  const { activeOrganization } = useAuth()

  return (
    <AnnouncementManager
      queryKey={['officer', 'announcements', activeOrganization?.id]}
      eyebrow={activeOrganization?.name ?? 'Organization'}
      description="Post schedules and reminders. Members get notified in the app — no one misses updates buried in a group chat."
      allowAudience
      load={officerApi.announcements}
      create={officerApi.createAnnouncement}
      update={officerApi.updateAnnouncement}
      remove={officerApi.deleteAnnouncement}
    />
  )
}
