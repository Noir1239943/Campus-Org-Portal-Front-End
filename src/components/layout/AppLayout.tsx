import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/cn'
import { studentMobileNav } from './navigation'
import { Sidebar, SidebarContent } from './Sidebar'
import { Topbar } from './Topbar'

/** Bottom tab bar for students on phones — the most used pages, one thumb away. */
function MobileNav() {
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden" aria-label="Quick">
      <div className="grid grid-cols-5">
        {studentMobileNav.map((item) => {
          const isCheckIn = item.to === '/check-in'
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn('flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium', isActive ? 'text-blue-600' : 'text-slate-500')
              }
            >
              {isCheckIn ? (
                <span className="-mt-5 grid size-12 place-items-center rounded-full bg-blue-600 text-white shadow-lg ring-4 ring-white">
                  <item.icon className="size-5" />
                </span>
              ) : (
                <item.icon className="size-5" />
              )}
              {item.label}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export function AppLayout() {
  const { workspace } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setDrawerOpen(false)
    window.scrollTo(0, 0)
  }, [location.pathname])

  const showMobileNav = workspace === 'student'

  return (
    <div className="min-h-dvh">
      <Sidebar />

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div className="animate-fade-in absolute inset-0 bg-slate-900/50" onClick={() => setDrawerOpen(false)} />
          <div className="animate-slide-in absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-navy-900 shadow-2xl">
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute top-4 right-3 z-10 grid size-8 place-items-center rounded-lg text-blue-100/70 hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <Topbar onMenu={() => setDrawerOpen(true)} />
        <main className={cn('mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8', showMobileNav && 'pb-28 lg:pb-8')}>
          <Outlet />
        </main>
      </div>

      {showMobileNav && <MobileNav />}
    </div>
  )
}
