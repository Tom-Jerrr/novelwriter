import { createContext, useContext } from 'react'
import type { NovelShellRouteState } from './NovelShellRouteState'

export interface NovelShellState {
  drawerWidth: number
  setDrawerWidth: (nextWidth: number) => void
}

export interface NovelShellContextValue {
  routeState: NovelShellRouteState
  shellState: NovelShellState
}

export const NovelShellContext = createContext<NovelShellContextValue | null>(null)

export function useNovelShell() {
  const context = useContext(NovelShellContext)
  if (!context) {
    throw new Error('useNovelShell must be used within a NovelShellProvider')
  }
  return context
}

export function useOptionalNovelShell() {
  return useContext(NovelShellContext)
}
