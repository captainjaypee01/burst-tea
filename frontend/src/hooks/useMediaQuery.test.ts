import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useMediaQuery } from '@/hooks/useMediaQuery'

describe('useMediaQuery', () => {
  it('tracks matchMedia updates', () => {
    const listeners = new Set<(e: { matches: boolean }) => void>()
    const mq = {
      matches: false,
      addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
        listeners.add(cb)
      },
      removeEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
        listeners.delete(cb)
      },
    }

    const original = window.matchMedia
    window.matchMedia = () => mq as unknown as MediaQueryList

    const { result, unmount } = renderHook(() => useMediaQuery('(min-width: 9999px)'))

    expect(result.current).toBe(false)

    mq.matches = true
    act(() => {
      listeners.forEach((cb) => {
        cb({ matches: true })
      })
    })

    expect(result.current).toBe(true)

    unmount()
    window.matchMedia = original
  })
})
