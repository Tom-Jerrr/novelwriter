import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  setAtlasSuggestionTargetSearchParams,
} from '@/components/novel-shell/NovelShellRouteState'
import type {
  CopilotReviewKind,
  CopilotSuggestionTarget,
} from '@/types/copilot'

export function useAtlasCopilotTargetNavigation(options?: {
  onBeforeNavigate?: (target: CopilotSuggestionTarget) => void
  onBeforeReviewTarget?: (target: CopilotSuggestionTarget) => void
}) {
  const [, setSearchParams] = useSearchParams()

  return useCallback((target: CopilotSuggestionTarget) => {
    options?.onBeforeNavigate?.(target)
    if (target.tab === 'review') options?.onBeforeReviewTarget?.(target)

    setSearchParams((prev) => setAtlasSuggestionTargetSearchParams(prev, target), {
      replace: true,
    })
  }, [options, setSearchParams])
}

export function useStudioCopilotTargetNavigation(options: {
  navigateToReviewStage: (reviewKind: CopilotReviewKind) => void
  navigateToEntityStage: (entityId: number | null) => void
  navigateToRelationshipStage: (entityId: number | null) => void
  navigateToSystemStage: (systemId: number | null) => void
  navigateToAtlas: (params?: URLSearchParams) => void
}) {
  return useCallback((target: CopilotSuggestionTarget) => {
    if (target.tab === 'review') {
      if (target.highlight_id != null) {
        options.navigateToAtlas(setAtlasSuggestionTargetSearchParams(new URLSearchParams(), target))
        return
      }
      options.navigateToReviewStage(target.review_kind ?? 'entities')
      return
    }

    if (target.tab === 'entities') {
      options.navigateToEntityStage(target.entity_id ?? target.resource_id)
      return
    }

    if (target.tab === 'relationships') {
      options.navigateToRelationshipStage(target.entity_id ?? target.resource_id)
      return
    }

    if (target.tab === 'systems' && target.resource_id !== null) {
      options.navigateToSystemStage(target.resource_id)
      return
    }

    options.navigateToAtlas(setAtlasSuggestionTargetSearchParams(new URLSearchParams(), target))
  }, [options])
}
