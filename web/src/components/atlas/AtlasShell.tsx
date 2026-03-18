import type { ReactNode } from 'react'
import { ToastProvider } from '@/components/world-model/shared/Toast'

/**
 * Atlas module shell.
 *
 * World-model hooks/components are allowed to use module-scoped providers
 * (e.g. toast). Any future embedding should wrap with this shell.
 */
export function AtlasShell({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>
}
