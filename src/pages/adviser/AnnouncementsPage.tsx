import { adviserApi } from '@/api/adviser'
import { AnnouncementManager } from '@/components/shared/AnnouncementManager'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function AdviserAnnouncementsPage() {
  useDocumentTitle('Campus announcements')

  return (
    <AnnouncementManager
      queryKey={['adviser', 'announcements']}
      eyebrow="Office of Student Affairs"
      description="Campus-wide announcements reach every student's feed and notifications."
      allowAudience={false}
      load={adviserApi.announcements}
      create={adviserApi.createAnnouncement}
      update={adviserApi.updateAnnouncement}
      remove={adviserApi.deleteAnnouncement}
    />
  )
}
