import type { CopilotRunStatus } from '@/types/copilot'

export function getCopilotRunStatusMeta(status: CopilotRunStatus | null) {
  switch (status) {
    case 'queued':
      return {
        label: '排队中',
        dotClassName: 'bg-[hsl(var(--foreground)/0.38)]',
        toneClassName: 'text-muted-foreground',
      }
    case 'running':
      return {
        label: '运行中',
        dotClassName: 'bg-[hsl(var(--foreground)/0.80)] animate-pulse shadow-[0_0_12px_hsl(var(--foreground)/0.14)]',
        toneClassName: 'text-foreground/80',
      }
    case 'error':
    case 'interrupted':
      return {
        label: status === 'interrupted' ? '已中断' : '异常',
        dotClassName: 'bg-[hsl(var(--color-danger))] shadow-[0_0_10px_hsl(var(--color-danger)/0.40)]',
        toneClassName: 'text-[hsl(var(--color-danger))]',
      }
    case 'completed':
      return {
        label: '已完成',
        dotClassName: 'bg-[hsl(var(--foreground)/0.62)]',
        toneClassName: 'text-foreground/70',
      }
    default:
      return {
        label: '待命',
        dotClassName: 'bg-muted-foreground/70',
        toneClassName: 'text-muted-foreground',
      }
  }
}

export function getCopilotSuggestionKindMeta(kind: string) {
  switch (kind) {
    case 'create_entity':
    case 'update_entity':
    case 'entity_update':
      return {
        label: '实体',
        chipClassName: 'border-[hsl(var(--foreground)/0.12)] bg-[hsl(var(--foreground)/0.06)] text-foreground/82',
        accentClassName: 'bg-[hsl(var(--foreground)/0.52)]',
      }
    case 'create_relationship':
    case 'update_relationship':
    case 'relationship_update':
      return {
        label: '关系',
        chipClassName: 'border-[hsl(var(--foreground)/0.12)] bg-[hsl(var(--foreground)/0.05)] text-foreground/74',
        accentClassName: 'bg-[hsl(var(--foreground)/0.38)]',
      }
    case 'create_system':
    case 'update_system':
    case 'system_update':
      return {
        label: '体系',
        chipClassName: 'border-[hsl(var(--foreground)/0.12)] bg-[hsl(var(--foreground)/0.04)] text-foreground/68',
        accentClassName: 'bg-[hsl(var(--foreground)/0.28)]',
      }
    default:
      return {
        label: kind,
        chipClassName: 'border-[hsl(var(--foreground)/0.10)] bg-[hsl(var(--foreground)/0.04)] text-muted-foreground',
        accentClassName: 'bg-[hsl(var(--foreground)/0.18)]',
      }
  }
}

export function getCopilotEvidenceSourceMeta(sourceType: string) {
  switch (sourceType) {
    case 'chapter_excerpt':
      return {
        label: '章节片段',
        chipClassName: 'border-[hsl(var(--foreground)/0.12)] bg-[hsl(var(--foreground)/0.06)] text-foreground/80',
      }
    case 'world_entity':
      return {
        label: '设定条目',
        chipClassName: 'border-[hsl(var(--foreground)/0.12)] bg-[hsl(var(--foreground)/0.06)] text-foreground/80',
      }
    case 'world_relationship':
      return {
        label: '关系设定',
        chipClassName: 'border-[hsl(var(--foreground)/0.12)] bg-[hsl(var(--foreground)/0.05)] text-foreground/74',
      }
    case 'world_system':
      return {
        label: '体系设定',
        chipClassName: 'border-[hsl(var(--foreground)/0.12)] bg-[hsl(var(--foreground)/0.04)] text-foreground/68',
      }
    case 'evidence_pack':
      return {
        label: '相关线索',
        chipClassName: 'border-[hsl(var(--foreground)/0.12)] bg-[hsl(var(--foreground)/0.05)] text-foreground/74',
      }
    case 'draft_review':
      return {
        label: '草稿项',
        chipClassName: 'border-[hsl(var(--foreground)/0.12)] bg-[hsl(var(--foreground)/0.04)] text-foreground/68',
      }
    default:
      return {
        label: sourceType,
        chipClassName: 'border-[hsl(var(--foreground)/0.10)] bg-[hsl(var(--foreground)/0.04)] text-muted-foreground',
      }
  }
}
