import { Outlet } from 'react-router-dom'
import { NovelShellProvider } from './NovelShellProvider'
import { ToastProvider } from '@/components/world-model/shared/Toast'

export function NovelShell() {
  return (
    <ToastProvider>
      <NovelShellProvider>
        <Outlet />
      </NovelShellProvider>
    </ToastProvider>
  )
}
