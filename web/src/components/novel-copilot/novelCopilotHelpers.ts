import type { CopilotPrefill } from '@/types/copilot'

export type CopilotScenario = 'whole_book' | 'current_entity' | 'relationships' | 'draft_cleanup'

export function getCopilotScenario(prefill: CopilotPrefill): CopilotScenario {
  if (prefill.mode === 'draft_cleanup') return 'draft_cleanup'
  if (prefill.scope === 'whole_book') return 'whole_book'
  if (prefill.context?.tab === 'relationships') return 'relationships'
  return 'current_entity'
}

export function getCopilotScopeLabel(prefill: CopilotPrefill) {
  const scenario = getCopilotScenario(prefill)
  if (scenario === 'whole_book') return '全书研究'
  if (scenario === 'draft_cleanup') return '草稿上下文'
  if (scenario === 'relationships') return '关系上下文'
  return '实体上下文'
}

export function getDefaultCopilotSessionTitle(prefill: CopilotPrefill) {
  if (prefill.scope === 'whole_book') return '全书探索'
  if (prefill.mode === 'draft_cleanup') return '草稿整理'
  if (prefill.context?.tab === 'relationships') {
    return prefill.context?.entity_id ? `实体 ${prefill.context.entity_id} ↔ 相关实体` : '关系上下文'
  }
  if (prefill.scope === 'current_entity') {
    return prefill.context?.entity_id ? `实体 ${prefill.context.entity_id}` : '实体补完'
  }
  return '当前上下文'
}
