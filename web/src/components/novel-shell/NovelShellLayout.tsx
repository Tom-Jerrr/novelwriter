import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function NovelShellLayout({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex min-h-0 flex-1 overflow-hidden', className)}>
      {children}
    </div>
  )
}
