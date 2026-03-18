import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function NovelShellRail({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <aside className={cn('shrink-0 overflow-hidden', className)}>
      {children}
    </aside>
  )
}
