import type {
  CopilotContextStage,
  CopilotContextSurface,
  OpenNovelCopilotOptions,
  CopilotPrefill,
} from '@/types/copilot'
import type { NovelShellRouteState } from '@/components/novel-shell/NovelShellRouteState'

export type NovelCopilotLaunchArgs = [
  prefill: CopilotPrefill,
  options?: OpenNovelCopilotOptions,
]

type CopilotRouteContext = Pick<NovelShellRouteState, 'surface' | 'stage' | 'worldTab'>

function buildWholeBookContext(routeState: CopilotRouteContext | null | undefined) {
  if (!routeState?.surface) return undefined

  if (routeState.surface === 'atlas') {
    const tab = routeState.worldTab ?? 'systems'
    return {
      surface: 'atlas' as const,
      tab,
    }
  }

  return {
    surface: 'studio' as const,
    stage: routeState.stage ?? 'write',
  }
}

export function buildWholeBookCopilotLaunchArgs(
  routeState?: CopilotRouteContext | null,
): NovelCopilotLaunchArgs {
  return [
    {
      mode: 'research',
      scope: 'whole_book',
      context: buildWholeBookContext(routeState),
    },
    { displayTitle: '全书探索' },
  ]
}

export function buildCurrentEntityCopilotLaunchArgs({
  entityId,
  entityName,
  surface,
  stage,
}: {
  entityId: number
  entityName?: string | null
  surface?: CopilotContextSurface
  stage?: CopilotContextStage
}): NovelCopilotLaunchArgs {
  return [
    {
      mode: 'current_entity',
      scope: 'current_entity',
      context: surface === 'atlas'
        ? {
            entity_id: entityId,
            surface: 'atlas',
            tab: 'entities',
          }
        : {
            entity_id: entityId,
            ...(surface ? { surface } : {}),
            ...(stage ? { stage } : {}),
          },
    },
    { displayTitle: entityName?.trim() || `实体 ${entityId}` },
  ]
}

export function buildRelationshipResearchCopilotLaunchArgs({
  entityId,
  entityName,
  surface,
  stage,
}: {
  entityId?: number | null
  entityName?: string | null
  surface: CopilotContextSurface
  stage?: CopilotContextStage
}): NovelCopilotLaunchArgs {
  const normalizedEntityId = typeof entityId === 'number' ? entityId : undefined
  const displayTitle = entityName?.trim()
    ? `${entityName.trim()} ↔ 相关实体`
    : normalizedEntityId != null
      ? `实体 ${normalizedEntityId} ↔ 相关实体`
      : '关系上下文'

  return [
    {
      mode: 'research',
      scope: 'current_tab',
      context: surface === 'atlas'
        ? {
            entity_id: normalizedEntityId,
            surface: 'atlas',
            tab: 'relationships',
          }
        : {
            entity_id: normalizedEntityId,
            surface,
            tab: 'relationships',
            ...(stage ? { stage } : {}),
          },
    },
    { displayTitle },
  ]
}

export function buildDraftCleanupCopilotLaunchArgs({
  surface,
  stage,
}: {
  surface: CopilotContextSurface
  stage?: CopilotContextStage
}): NovelCopilotLaunchArgs {
  return [
    {
      mode: 'draft_cleanup',
      scope: 'current_tab',
      context: surface === 'atlas'
        ? {
            surface: 'atlas',
            tab: 'review',
          }
        : {
            surface,
            tab: 'review',
            ...(stage ? { stage } : {}),
          },
    },
    { displayTitle: '草稿整理' },
  ]
}
