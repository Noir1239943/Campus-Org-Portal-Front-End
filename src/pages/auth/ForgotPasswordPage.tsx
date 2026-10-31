import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Building2, CheckCircle2, IdCard, KeyRound } from 'lucide-react'
import { authApi } from '@/api/auth'
import { getErrorMessage } from '@/api/client'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Feedback'
import { Field, Input } from '@/components/ui/Field'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const steps = [
  { icon: IdCard, text: 'Send a reset request below using your ID number or email.' },
  { icon: Building2, text: 'Visit the Office of Student Affairs and show your school ID.' },
  { icon: KeyRound, text: 'Log in with the temporary password, then change it on your Profile page.' },
]

export default function ForgotPasswordPage() {
  useDocumentTitle('Forgot password')
  const [login, setLogin] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await authApi.forgotPassword(login.trim())
      setMessage(res.message)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-sm">
        <Link to="/login" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800">
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>

        <img src="/cpc-logo.png" alt="" className="mt-8 size-14" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Forgot your password?</h1>
        <p className="mt-1.5 text-sm text-slate-500">For your security, password resets are done by the Office of Student Affairs (OSA).</p>

        <ol className="mt-6 space-y-3">
          {steps.map(({ icon: Icon, text }, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-600">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                <Icon className="size-4" />
              </span>
              <span className="pt-1.5">{text}</span>
            </li>
          ))}
        </ol>

        {message ? (
          <Alert tone="success" icon={<CheckCircle2 />} className="mt-6" title="Request sent">
            {message}
          </Alert>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            {error && <Alert tone="danger">{error}</Alert>}
            <Field label="School ID number or email">
              {(id) => <Input id={id} value={login} onChange={(e) => setLogin(e.target.value)} placeholder="2024-00145" autoCapitalize="none" required />}
            </Field>
            <Button type="submit" size="lg" className="w-full" loading={loading} disabled={!login.trim()}>
              Send reset request
            </Button>
          </form>
        )}
      </div>
    </AuthLayout>
  )
}
