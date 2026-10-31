import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, IdCard, LockKeyhole, LogIn } from 'lucide-react'
import { getErrorMessage, getFieldErrors } from '@/api/client'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Feedback'
import { Checkbox, Field, Input } from '@/components/ui/Field'
import { useAuth } from '@/context/AuthContext'
import { workspaceHome } from '@/context/workspace'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function LoginPage() {
  useDocumentTitle('Log in')
  const { user, workspace, login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [form, setForm] = useState({ login: '', password: '', remember: true })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const redirect = params.get('redirect')
  const safeRedirect = redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : null

  if (user) return <Navigate to={safeRedirect ?? workspaceHome[workspace]} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setFieldErrors({})

    try {
      const session = await login(form.login.trim(), form.password, form.remember)
      navigate(safeRedirect ?? workspaceHome[session.workspaces[0] ?? 'student'], { replace: true })
    } catch (err) {
      const fields = getFieldErrors(err)
      setFieldErrors(fields)
      setError(fields.login && Object.keys(fields).length === 1 ? fields.login : getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <img src="/cpc-logo.png" alt="Cordova Public College seal" className="size-20 drop-shadow-sm lg:hidden" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 lg:mt-0">Welcome back</h1>
          <p className="mt-1.5 text-sm text-slate-500">Sign in with your school ID number or CPC email.</p>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
          {error && <Alert tone="danger">{error}</Alert>}

          <Field label="School ID number or email" error={fieldErrors.login && !error ? fieldErrors.login : undefined}>
            {(id) => (
              <div className="relative">
                <IdCard className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id={id}
                  className="pl-9"
                  autoComplete="username"
                  autoCapitalize="none"
                  inputMode="email"
                  placeholder="2024-00145 or name@cpc.edu.ph"
                  value={form.login}
                  onChange={(e) => setForm({ ...form, login: e.target.value })}
                  invalid={!!fieldErrors.login}
                  required
                />
              </div>
            )}
          </Field>

          <Field
            label={
              <span className="flex items-center justify-between">
                Password
                <Link to="/forgot-password" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                  Forgot password?
                </Link>
              </span>
            }
            error={fieldErrors.password}
          >
            {(id) => (
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id={id}
                  type={showPassword ? 'text' : 'password'}
                  className="pr-10 pl-9"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
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

          <Checkbox label="Keep me signed in on this device" checked={form.remember} onChange={(e) => setForm({ ...form, remember: e.target.checked })} />

          <Button type="submit" size="lg" className="w-full" loading={loading} icon={<LogIn className="size-4" />}>
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:text-blue-700">
            Create an account
          </Link>
        </p>

        <p className="mt-6 text-center text-xs text-slate-400">
          Having trouble? Visit the Office of Student Affairs with your school ID.
        </p>
      </div>
    </AuthLayout>
  )
}
