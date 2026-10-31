import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, Menu, UserRound } from 'lucide-react'
import { Avatar } from '@/components/ui/Misc'
import { useAuth } from '@/context/AuthContext'
import { NotificationBell } from './NotificationBell'
import { workspaceLabels } from './navigation'

function UserMenu() {
  const { user, workspace, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  if (!user) return null

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-lg py-1 pr-1.5 pl-1 hover:bg-slate-100" aria-expanded={open}>
        <Avatar initials={user.initials} name={user.name} size="sm" />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-xs font-semibold text-slate-800">{user.name}</span>
          <span className="block text-[11px] text-slate-500">{workspaceLabels[workspace]}</span>
        </span>
        <ChevronDown className="size-4 text-slate-400" />
      </button>

      {open && (
        <div className="animate-pop-in absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-xl bg-white py-1 shadow-xl ring-1 ring-slate-200">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500">{user.id_number}</p>
            {user.program_label && <p className="text-xs text-slate-500">{user.program_label}</p>}
          </div>
          <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <UserRound className="size-4 text-slate-400" /> Profile & password
          </Link>
          <button
            onClick={async () => {
              await logout()
              navigate('/login', { replace: true })
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="size-4" /> Log out
          </button>
        </div>
      )}
    </div>
  )
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { campus } = useAuth()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur sm:px-6">
      <button onClick={onMenu} className="-ml-1 grid size-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
        <Menu className="size-5" />
      </button>

      <Link to="/" className="flex items-center gap-2 lg:hidden">
        <img src="/cpc-logo.png" alt="" className="size-8" />
        <span className="text-sm font-semibold text-slate-900">CPC Orgs</span>
      </Link>

      {campus && (
        <p className="hidden items-center gap-2 text-xs text-slate-500 lg:flex">
          <span className="font-medium text-slate-700">A.Y. {campus.academic_year}</span>
          <span className="size-1 rounded-full bg-slate-300" />
          <span>{campus.semester}</span>
          <span className="size-1 rounded-full bg-slate-300" />
          <span>{campus.location}</span>
        </p>
      )}

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  )
}
