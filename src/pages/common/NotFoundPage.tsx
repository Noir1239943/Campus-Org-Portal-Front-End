import { Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function NotFoundPage() {
  useDocumentTitle('Page not found')

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <img src="/cpc-logo.png" alt="" className="size-20 opacity-90" />
      <p className="mt-6 text-sm font-semibold text-blue-600">404</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">We can't find that page</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">The link may be old or the page was moved. Let's get you back.</p>
      <Button to="/" className="mt-6" icon={<Home className="size-4" />}>
        Go to my dashboard
      </Button>
    </div>
  )
}
