import { useAuthStore } from '../store/auth.store'
import { useWorkspaceStore } from '../store/workspace.store'

const ROLE_HIERARCHY: Record<string, number> = {
  VIEWER: 1,
  EDITOR: 2,
  ADMIN: 3,
  OWNER: 4,
}

export function useWorkspaceRole() {
  const { user } = useAuthStore()
  const { activeWorkspace } = useWorkspaceStore()

  const myMember = activeWorkspace?.members?.find((m: any) => m.userId === user?.id)
  const role = myMember?.role ?? (activeWorkspace?.ownerId === user?.id ? 'OWNER' : 'VIEWER')
  const level = ROLE_HIERARCHY[role] ?? 1

  return {
    role,
    isOwner: role === 'OWNER',
    isAdmin: level >= ROLE_HIERARCHY.ADMIN,
    isEditor: level >= ROLE_HIERARCHY.EDITOR,
    isViewer: level === ROLE_HIERARCHY.VIEWER,
    can: (minRole: string) => level >= (ROLE_HIERARCHY[minRole] ?? 99),
  }
}