import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { IdCard, KeyRound, Mail, Phone, Save } from 'lucide-react'
import { toast } from 'sonner'
import { authApi } from '@/api/auth'
import { getErrorMessage, getFieldErrors } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Feedback'
import { Field, Input } from '@/components/ui/Field'
import { Avatar, Detail, PageHeader } from '@/components/ui/Misc'
import { useAuth } from '@/context/AuthContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function ProfilePage() {
  useDocumentTitle('Profile')
  const { user, setSession, refresh, officerOrganizations } = useAuth()
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [passwords, setPasswords] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const saveProfile = useMutation({
    mutationFn: () => authApi.updateProfile({ phone: phone || null }),
    onSuccess: (session) => {
      setSession(session)
      toast.success('Profile saved.')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const changePassword = useMutation({
    mutationFn: () => authApi.changePassword(passwords),
    onSuccess: async (res) => {
      toast.success(res.message)
      setPasswords({ current_password: '', password: '', password_confirmation: '' })
      setErrors({})
      // Clears must_change_password so the rest of the app unlocks.
      await refresh()
    },
    onError: (e) => {
      setErrors(getFieldErrors(e))
      toast.error(getErrorMessage(e))
    },
  })

  if (!user) return null

  const submitPassword = (e: FormEvent) => {
    e.preventDefault()
    changePassword.mutate()
  }

  return (
    <>
      <PageHeader title="Profile & password" description="Your school record comes from the registrar. You can update your phone number and password here." />

      {user.must_change_password && (
        <Alert className="mb-6" tone="warning" icon={<KeyRound />} title="Please set a new password before continuing.">
          You are using a temporary password from the Office of Student Affairs. Enter it below as your current password, then choose a new one.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardBody className="flex flex-col items-center text-center">
            <Avatar initials={user.initials} name={user.name} size="lg" />
            <h2 className="mt-3 text-lg font-semibold text-slate-900">{user.name}</h2>
            <p className="text-sm text-slate-500">{user.program_label ?? user.title}</p>
            {officerOrganizations.length > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                Officer: {officerOrganizations.map((o) => `${o.position}, ${o.acronym}`).join(' · ')}
              </p>
            )}
            <div className="mt-6 w-full space-y-4 text-left">
              <Detail icon={<IdCard />} label="ID number">{user.id_number}</Detail>
              <Detail icon={<Mail />} label="Email">{user.email}</Detail>
              {user.section && <Detail icon={<IdCard />} label="Section">{user.section}</Detail>}
            </div>
          </CardBody>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Contact number" subtitle="Officers may use this for event coordination" />
            <CardBody>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  saveProfile.mutate()
                }}
                className="flex flex-col gap-3 sm:flex-row sm:items-end"
              >
                <Field label="Mobile number" className="flex-1">
                  {(id) => (
                    <div className="relative">
                      <Phone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                      <Input id={id} className="pl-9" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0917 123 4567" maxLength={30} />
                    </div>
                  )}
                </Field>
                <Button type="submit" loading={saveProfile.isPending} icon={<Save className="size-4" />}>
                  Save
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Change password" subtitle="Use at least 8 characters with letters and numbers" />
            <CardBody>
              <form onSubmit={submitPassword} className="space-y-4">
                <Field label="Current password" error={errors.current_password}>
                  {(id) => <Input id={id} type="password" autoComplete="current-password" value={passwords.current_password} onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })} invalid={!!errors.current_password} />}
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="New password" error={errors.password}>
                    {(id) => <Input id={id} type="password" autoComplete="new-password" value={passwords.password} onChange={(e) => setPasswords({ ...passwords, password: e.target.value })} invalid={!!errors.password} />}
                  </Field>
                  <Field label="Confirm new password">
                    {(id) => <Input id={id} type="password" autoComplete="new-password" value={passwords.password_confirmation} onChange={(e) => setPasswords({ ...passwords, password_confirmation: e.target.value })} />}
                  </Field>
                </div>
                {passwords.password && passwords.password_confirmation && passwords.password !== passwords.password_confirmation && (
                  <Alert tone="warning">The new passwords don't match yet.</Alert>
                )}
                <Button type="submit" loading={changePassword.isPending} disabled={!passwords.current_password || !passwords.password || passwords.password !== passwords.password_confirmation} icon={<KeyRound className="size-4" />}>
                  Update password
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}
