import { cn } from '@/lib/utils'
import { useUiLocale } from '@/contexts/UiLocaleContext'
import { copilotPillClassName } from './novelCopilotChrome'

interface AiStatusPillProps {
  status: 'idle' | 'running' | 'error' | 'connected'
  className?: string
  onClick?: () => void
}

export function AiStatusPill({ status, className, onClick }: AiStatusPillProps) {
  const { t } = useUiLocale()
  const statusConfig = {
    idle: {
      label: t('copilot.aiStatus.idle'),
      color:
        'border-[hsl(var(--foreground)/0.10)] bg-[hsl(var(--foreground)/0.04)] text-muted-foreground',
      dot: 'bg-muted-foreground',
    },
    connected: {
      label: t('copilot.aiStatus.connected'),
      color:
        'border-[hsl(var(--foreground)/0.12)] bg-[hsl(var(--foreground)/0.05)] text-foreground/78',
      dot: 'bg-[hsl(var(--foreground)/0.72)]',
    },
    running: {
      label: t('copilot.aiStatus.running'),
      color: 'border-[hsl(var(--foreground)/0.14)] bg-[hsl(var(--foreground)/0.08)] text-foreground/84',
      dot: 'bg-[hsl(var(--foreground)/0.84)] animate-pulse',
    },
    error: {
      label: t('copilot.aiStatus.error'),
      color:
        'bg-[hsl(var(--color-danger)/0.12)] text-[hsl(var(--color-danger))] border-[hsl(var(--color-danger)/0.24)]',
      dot: 'bg-[hsl(var(--color-danger))]',
    },
  }

  const { label, color, dot } = statusConfig[status]

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors',
        status === 'idle' && copilotPillClassName,
        color,
        onClick && 'hover:brightness-110 cursor-pointer',
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
      {label}
    </button>
  )
}
