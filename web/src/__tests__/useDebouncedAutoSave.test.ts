import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebouncedAutoSave } from '@/hooks/useDebouncedAutoSave'

describe('useDebouncedAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('flush triggers save for pending scheduled value', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useDebouncedAutoSave<string>({ delayMs: 5000, save }))

    // Schedule a value — should NOT save immediately
    act(() => result.current.schedule('draft content'))
    expect(save).not.toHaveBeenCalled()
    expect(result.current.status).toBe('unsaved')

    // Flush — should save the pending value immediately
    await act(() => result.current.flush())
    expect(save).toHaveBeenCalledOnce()
    expect(save).toHaveBeenCalledWith('draft content')
    expect(result.current.status).toBe('saved')
  })

  it('flush is a no-op when nothing is pending', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useDebouncedAutoSave<string>({ delayMs: 5000, save }))

    await act(() => result.current.flush())
    expect(save).not.toHaveBeenCalled()
    expect(result.current.status).toBe('idle')
  })
})
