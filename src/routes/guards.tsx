import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { workspaceHome } from '@/context/workspace'
import type { Workspace } from '@/types'

function FullScreenLoader() {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas">
      <div className="flex flex-col items-center gap-4">
        <img src="/cpc-logo.png" alt="" className="size-16 animate-pulse" />
        <p className="text-sm text-slate-500">Loading your workspace…</p>
      </div>
    </div>
  )
}

/** Only signed-in users; others go to /login and come back afterwards. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isReady } = useAuth()
  const location = useLocation()

  if (!isReady) return <FullScreenLoader />

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }

  return <>{children}</>
}

/**
 * Pages that belong to one workspace. If the user has that workspace
 * (e.g. a student officer opening an officer link from a notification),
 * switch to it automatically; otherwise send them home.
 */
export function RequireWorkspace({ workspace, children }: { workspace: Workspace; children: ReactNode }) {
  const { workspaces, workspace: current, switchWorkspace, refresh } = useAuth()
  const allowed = workspaces.includes(workspace)
  const [refreshed, setRefreshed] = useState(false)

  useEffect(() => {
    if (allowed && current !== workspace) switchWorkspace(workspace)
  }, [allowed, current, workspace, switchWorkspace])

  // A student who was just made an officer may not have the workspace in their
  // session yet: reload it once before giving up.
  useEffect(() => {
    if (allowed || refreshed) return
    refresh().finally(() => setRefreshed(true))
  }, [allowed, refreshed, refresh])

  if (!allowed && !refreshed) return <FullScreenLoader />
  if (!allowed) return <Navigate to={workspaceHome[current]} replace />
  if (current !== workspace) return null

  return <>{children}</>
}

/** "/" → the right dashboard for the current workspace. */
export function HomeRedirect() {
  const { workspace } = useAuth()
  return <Navigate to={workspaceHome[workspace]} replace />
}
