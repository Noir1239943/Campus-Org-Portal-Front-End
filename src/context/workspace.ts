import type { Workspace } from '@/types'

/** Home page for each workspace. */
export const workspaceHome: Record<Workspace, string> = {
  student: '/dashboard',
  officer: '/officer',
  adviser: '/adviser',
}
