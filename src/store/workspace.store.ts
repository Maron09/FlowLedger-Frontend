import { create } from 'zustand'


interface Workspace {
    id: string
    name: string
    type: 'PERSONAL' | 'BUSINESS'
    currency: string
    members: { role: string }[]
}

interface WorkspaceState {
    workspaces: Workspace[]
    activeWorkspace: Workspace | null
    setWorkspaces: (workspaces: Workspace[]) => void
    setActiveWorkspace: (workspace: Workspace) => void
    reset: () => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
    workspaces: [],
    activeWorkspace: null,

    setWorkspaces: (workspaces) => set({ workspaces }),
    setActiveWorkspace: (workspace) => {
        localStorage.setItem('activeWorkspaceId', workspace.id)
        set({ activeWorkspace: workspace })
    },

    reset: () => {
        localStorage.removeItem('activeWorkspaceId')
        set({ workspaces: [], activeWorkspace: null })
    }
}))