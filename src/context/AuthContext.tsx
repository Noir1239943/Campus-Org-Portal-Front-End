import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { ORG_KEY, TOKEN_KEY } from '@/api/client'
import type { CampusMeta, OfficerOrganization, Session, User, Workspace } from '@/types'

const WORKSPACE_KEY = 'cpc_workspace'

interface AuthContextValue {
  user: User | null
  campus: CampusMeta | null
  workspaces: Workspace[]
  officerOrganizations: OfficerOrganization[]
  workspace: Workspace
  activeOrganization: OfficerOrganization | null
  isReady: boolean
  login: (login: string, password: string, remember: boolean) => Promise<Session>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  setSession: (session: Session) => void
  switchWorkspace: (workspace: Workspace) => void
  switchOrganization: (organizationId: number) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function pickWorkspace(session: Session): Workspace {
  const saved = localStorage.getItem(WORKSPACE_KEY) as Workspace | null
  if (saved && session.workspaces.includes(saved)) return saved
  return session.workspaces[0] ?? 'student'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSessionState] = useState<Session | null>(null)
  const [workspace, setWorkspace] = useState<Workspace>('student')
  const [activeOrgId, setActiveOrgId] = useState<number | null>(() => Number(localStorage.getItem(ORG_KEY)) || null)
  const [isReady, setIsReady] = useState(false)

  const setSession = useCallback((next: Session) => {
    setSessionState(next)
    setWorkspace(pickWorkspace(next))

    // Keep the selected officer organization valid.
    const orgIds = next.officer_organizations.map((o) => o.id)
    const stored = Number(localStorage.getItem(ORG_KEY))
    const orgId = orgIds.includes(stored) ? stored : (orgIds[0] ?? null)
    setActiveOrgId(orgId)
    if (orgId) localStorage.setItem(ORG_KEY, String(orgId))
    else localStorage.removeItem(ORG_KEY)
  }, [])

  const clear = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(ORG_KEY)
    localStorage.removeItem(WORKSPACE_KEY)
    setSessionState(null)
    queryClient.clear()
  }, [queryClient])

  const refresh = useCallback(async () => {
    try {
      setSession(await authApi.me())
    } catch {
      clear()
    }
  }, [setSession, clear])

  // Restore the session on page load.
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setIsReady(true)
      return
    }
    refresh().finally(() => setIsReady(true))
  }, [refresh])

  // Expired token anywhere in the app → back to login.
  useEffect(() => {
    const onUnauthorized = () => clear()
    window.addEventListener('cpc:unauthorized', onUnauthorized)
    return () => window.removeEventListener('cpc:unauthorized', onUnauthorized)
  }, [clear])

  const login = useCallback(
    async (login: string, password: string, remember: boolean) => {
      const { token, ...rest } = await authApi.login({ login, password, remember })
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.removeItem(WORKSPACE_KEY)
      queryClient.clear()
      setSession(rest)
      return rest
    },
    [queryClient, setSession],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Ignore: the token may already be expired.
    }
    clear()
  }, [clear])

  const switchWorkspace = useCallback(
    (next: Workspace) => {
      if (!session?.workspaces.includes(next)) return
      localStorage.setItem(WORKSPACE_KEY, next)
      setWorkspace(next)
    },
    [session],
  )

  const switchOrganization = useCallback(
    (organizationId: number) => {
      localStorage.setItem(ORG_KEY, String(organizationId))
      setActiveOrgId(organizationId)
      // Officer data belongs to the previous organization.
      queryClient.removeQueries({ queryKey: ['officer'] })
    },
    [queryClient],
  )

  const value = useMemo<AuthContextValue>(() => {
    const officerOrganizations = session?.officer_organizations ?? []

    return {
      user: session?.user ?? null,
      campus: session?.campus ?? null,
      workspaces: session?.workspaces ?? [],
      officerOrganizations,
      workspace,
      activeOrganization: officerOrganizations.find((o) => o.id === activeOrgId) ?? officerOrganizations[0] ?? null,
      isReady,
      login,
      logout,
      refresh,
      setSession,
      switchWorkspace,
      switchOrganization,
    }
  }, [session, workspace, activeOrgId, isReady, login, logout, refresh, setSession, switchWorkspace, switchOrganization])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
