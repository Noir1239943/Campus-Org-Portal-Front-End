import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Check, ChevronsUpDown, LifeBuoy } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { workspaceHome } from '@/context/workspace'
import { cn } from '@/lib/cn'
import type { Workspace } from '@/types'
import { navigation, workspaceLabels } from './navigation'

export function Brand({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img src="/cpc-logo.png" alt="Cordova Public College seal" className="size-10 shrink-0 rounded-full bg-white p-0.5" />
      {!compact && (
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">Cordova Public College</p>
          <p className="text-[10px] font-medium tracking-wider text-blue-200/80 uppercase">Campus Organizations</p>
        </div>
      )}
    </div>
  )
}

function WorkspaceSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const { workspace, workspaces, officerOrganizations, activeOrganization, switchWorkspace, switchOrganization } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const canSwitch = workspaces.length > 1 || officerOrganizations.length > 1

  const choose = (next: Workspace, orgId?: number) => {
    if (orgId) switchOrganization(orgId)
    switchWorkspace(next)
    setOpen(false)
    onNavigate?.()
    navigate(workspaceHome[next])
  }

  const subtitle = workspace === 'officer' && activeOrganization ? `${activeOrganization.acronym} · ${activeOrganization.position}` : null

  return (
    <div className="relative">
      <button
        type="button"
        disabled={!canSwitch}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-xl bg-white/[0.06] px-3 py-2.5 text-left ring-1 ring-white/10',
          canSwitch && 'hover:bg-white/10',
        )}
        aria-expanded={open}
      >
        <span className="min-w-0">
          <span className="block text-[10px] font-semibold tracking-wider text-blue-200/70 uppercase">Viewing as</span>
          <span className="block truncate text-sm font-semibold text-white">{workspaceLabels[workspace]}</span>
          {subtitle && <span className="block truncate text-xs text-blue-100/70">{subtitle}</span>}
        </span>
        {canSwitch && <ChevronsUpDown className="size-4 shrink-0 text-blue-200/70" />}
      </button>

      {open && (
        <div className="animate-pop-in absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl bg-white py-1 shadow-xl ring-1 ring-slate-200">
          {workspaces.includes('student') && (
            <button onClick={() => choose('student')} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50">
              <span>
                <span className="block font-medium text-slate-800">Student</span>
                <span className="block text-xs text-slate-500">Your organizations, events and clearance</span>
              </span>
              {workspace === 'student' && <Check className="size-4 text-blue-600" />}
            </button>
          )}
          {officerOrganizations.map((org) => (
            <button
              key={org.id}
              onClick={() => choose('officer', org.id)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
            >
              <span>
                <span className="block font-medium text-slate-800">Officer · {org.acronym}</span>
                <span className="block text-xs text-slate-500">{org.position}</span>
              </span>
              {workspace === 'officer' && activeOrganization?.id === org.id && <Check className="size-4 text-blue-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { workspace } = useAuth()

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-5 pb-4">
        <Brand />
      </div>

      <div className="px-3">
        <WorkspaceSwitcher onNavigate={onNavigate} />
      </div>

      <nav className="scrollbar-thin mt-4 flex-1 space-y-0.5 overflow-y-auto px-3" aria-label="Main">
        {navigation[workspace].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-100/75 hover:bg-white/[0.06] hover:text-white',
              )
            }
          >
            <item.icon className="size-[18px] shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <NavLink
          to="/help"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
              isActive ? 'bg-white/10 text-white' : 'text-blue-100/75 hover:bg-white/[0.06] hover:text-white',
            )
          }
        >
          <LifeBuoy className="size-[18px]" />
          Help & resources
        </NavLink>
        <div className="mt-3 flex h-1 overflow-hidden rounded-full" aria-hidden>
          <span className="flex-1 bg-navy-700" />
          <span className="flex-1 bg-cpc-red" />
          <span className="flex-1 bg-cpc-gold" />
        </div>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-navy-900 lg:block">
      <SidebarContent />
    </aside>
  )
}
