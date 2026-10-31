import { useState } from 'react'
import { ClipboardCheck, Download, FileSpreadsheet, GraduationCap, Users } from 'lucide-react'
import { toast } from 'sonner'
import { downloadFile, getErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/Misc'
import { useAuth } from '@/context/AuthContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const reports = [
  {
    key: 'organizations',
    icon: Users,
    title: 'Organization summary',
    text: 'Every organization with status, adviser, members, events, average attendance and health. Good for recognition renewal.',
  },
  {
    key: 'attendance',
    icon: ClipboardCheck,
    title: 'Event attendance',
    text: 'One row per completed event: expected, present, late, excused, absent and attendance rate.',
  },
  {
    key: 'memberships',
    icon: FileSpreadsheet,
    title: 'Membership roster',
    text: 'All active memberships with ID number, program, position and join date.',
  },
  {
    key: 'participation',
    icon: GraduationCap,
    title: 'Student participation & clearance',
    text: 'One row per student: events attended, missed, excused, attendance rate, service hours and clearance status. Use this during clearance signing.',
  },
]

export default function ReportsPage() {
  useDocumentTitle('Reports')
  const { campus } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)

  const download = async (key: string) => {
    setLoading(key)
    try {
      await downloadFile(`/adviser/reports/${key}`, `${key}.csv`)
      toast.success('Report downloaded.')
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Student affairs"
        title="Reports"
        description={`Download up-to-date CSV reports for the ${campus?.semester ?? ''} of A.Y. ${campus?.academic_year ?? ''}. They open in Excel or Google Sheets.`}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map(({ key, icon: Icon, title, text }) => (
          <Card key={key}>
            <CardBody className="flex h-full flex-col">
              <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <Icon className="size-5" />
              </span>
              <h2 className="mt-4 text-sm font-semibold text-slate-900">{title}</h2>
              <p className="mt-1 flex-1 text-sm text-slate-500">{text}</p>
              <Button className="mt-4 self-start" variant="secondary" icon={<Download className="size-4" />} loading={loading === key} onClick={() => download(key)}>
                Download CSV
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  )
}
