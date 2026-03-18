import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function ArtifactStage({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden', className)}>
      {children}
    </section>
  )
}
