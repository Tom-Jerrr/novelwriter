import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useStudioCopilotTargetNavigation } from '@/components/novel-copilot/useCopilotTargetNavigation'

describe('useStudioCopilotTargetNavigation', () => {
  it('falls back to atlas navigation for review targets with a highlight id', () => {
    const navigateToReviewStage = vi.fn()
    const navigateToEntityStage = vi.fn()
    const navigateToRelationshipStage = vi.fn()
    const navigateToSystemStage = vi.fn()
    const navigateToAtlas = vi.fn()

    const { result } = renderHook(() => useStudioCopilotTargetNavigation({
      navigateToReviewStage,
      navigateToEntityStage,
      navigateToRelationshipStage,
      navigateToSystemStage,
      navigateToAtlas,
    }))

    result.current({
      resource: 'relationship',
      resource_id: 19,
      label: '苏瑶 ↔ 韩立',
      tab: 'review',
      review_kind: 'relationships',
      highlight_id: 19,
    })

    expect(navigateToReviewStage).not.toHaveBeenCalled()
    expect(navigateToAtlas).toHaveBeenCalledTimes(1)
    const params = navigateToAtlas.mock.calls[0]?.[0]
    expect(params).toBeInstanceOf(URLSearchParams)
    expect(params?.get('tab')).toBe('review')
    expect(params?.get('kind')).toBe('relationships')
    expect(params?.get('highlight')).toBe('19')
  })

  it('keeps studio review navigation for review targets without a highlight id', () => {
    const navigateToReviewStage = vi.fn()
    const navigateToEntityStage = vi.fn()
    const navigateToRelationshipStage = vi.fn()
    const navigateToSystemStage = vi.fn()
    const navigateToAtlas = vi.fn()

    const { result } = renderHook(() => useStudioCopilotTargetNavigation({
      navigateToReviewStage,
      navigateToEntityStage,
      navigateToRelationshipStage,
      navigateToSystemStage,
      navigateToAtlas,
    }))

    result.current({
      resource: 'entity',
      resource_id: 101,
      label: '苏瑶',
      tab: 'review',
      review_kind: 'entities',
    })

    expect(navigateToReviewStage).toHaveBeenCalledWith('entities')
    expect(navigateToAtlas).not.toHaveBeenCalled()
  })
})
