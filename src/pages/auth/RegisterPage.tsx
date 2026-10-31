import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { CheckCircle2, Eye, EyeOff, UserPlus } from 'lucide-react'
import { authApi } from '@/api/auth'
import { getErrorMessage, getFieldErrors } from '@/api/client'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Feedback'
import { Field, Input, Select } from '@/components/ui/Field'
import { useAuth } from '@/context/AuthContext'
import { workspaceHome } from '@/context/workspace'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const initial = {
  id_number: '',
  first_name: '',
  last_name: '',
  email: '',
  program: '',
  year_level: '1',
  section: '',
  password: '',
  password_confirmation: '',
}

export default function RegisterPage() {
  useDocumentTitle('Create an account')
  const { user, workspace } = useAuth()
  const [form, setForm] = useState(initial)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)

  if (user) return <Navigate to={workspaceHome[workspace]} replace />

  const set = (key: keyof typeof initial) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    if (form.password !== form.password_confirmation) {
      setFieldErrors({ password_confirmation: 'Passwords do not match.' })
      return
    }

    setLoading(true)
    try {
      await authApi.register({
        ...form,
        id_number: form.id_number.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        program: form.program.trim().toUpperCase(),
        section: form.section.trim().toUpperCase(),
        year_level: Number(form.year_level),
      })
      setDone(true)
    } catch (err) {
      setFieldErrors(getFieldErrors(err))
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const fieldError = (key: string) => (error ? undefined : fieldErrors[key])

  return (
    <AuthLayout>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <img src="/cpc-logo.png" alt="Cordova Public College seal" className="size-20 drop-shadow-sm lg:hidden" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 lg:mt-0">Create your account</h1>
          <p className="mt-1.5 text-sm text-slate-500">Register with your CPC school ID to join campus organizations.</p>
        </div>

        {done ? (
          <div className="mt-8 space-y-4">
            <Alert tone="success" icon={<CheckCircle2 />} title="Account created">
              Your account is ready. You can now sign in with your school ID number and password.
            </Alert>
            <Link to="/login">
              <Button size="lg" className="w-full">
                Go to sign in
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
            {error && <Alert tone="danger">{error}</Alert>}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" error={fieldError('first_name')}>
                {(id) => <Input id={id} autoComplete="given-name" value={form.first_name} onChange={set('first_name')} invalid={!!fieldErrors.first_name} required />}
              </Field>
              <Field label="Last name" error={fieldError('last_name')}>
                {(id) => <Input id={id} autoComplete="family-name" value={form.last_name} onChange={set('last_name')} invalid={!!fieldErrors.last_name} required />}
              </Field>
            </div>

            <Field label="School ID number" error={fieldError('id_number')}>
              {(id) => <Input id={id} placeholder="2024-00145" autoCapitalize="none" value={form.id_number} onChange={set('id_number')} invalid={!!fieldErrors.id_number} required />}
            </Field>

            <Field label="Email" error={fieldError('email')}>
              {(id) => (
                <Input id={id} type="email" autoComplete="email" autoCapitalize="none" placeholder="name@cpc.edu.ph" value={form.email} onChange={set('email')} invalid={!!fieldErrors.email} required />
              )}
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Program" error={fieldError('program')}>
                {(id) => <Input id={id} placeholder="BSIT" value={form.program} onChange={set('program')} invalid={!!fieldErrors.program} required />}
              </Field>
              <Field label="Year level" error={fieldError('year_level')}>
                {(id) => (
                  <Select id={id} value={form.year_level} onChange={set('year_level')} invalid={!!fieldErrors.year_level}>
                    {[1, 2, 3, 4, 5].map((y) => (
                      <option key={y} value={y}>
                        Year {y}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Section" error={fieldError('section')}>
                {(id) => <Input id={id} placeholder="A" value={form.section} onChange={set('section')} invalid={!!fieldErrors.section} required />}
              </Field>
            </div>

            <Field label="Password" error={fieldError('password')}>
              {(id) => (
                <div className="relative">
                  <Input
                    id={id}
                    type={showPassword ? 'text' : 'password'}
                    className="pr-10"
                    autoComplete="new-password"
                    placeholder="8+ characters, letters and numbers"
                    value={form.password}
                    onChange={set('password')}
                    invalid={!!fieldErrors.password}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              )}
            </Field>

            <Field label="Confirm password" error={fieldError('password_confirmation')}>
              {(id) => (
                <Input
                  id={id}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password_confirmation}
                  onChange={set('password_confirmation')}
                  invalid={!!fieldErrors.password_confirmation}
                  required
                />
              )}
            </Field>

            <Button type="submit" size="lg" className="w-full" loading={loading} icon={<UserPlus className="size-4" />}>
              Create account
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
