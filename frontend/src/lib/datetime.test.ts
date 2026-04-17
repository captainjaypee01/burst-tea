import { describe, expect, it } from 'vitest'

import { formatLocalDateTime } from './datetime'

describe('formatLocalDateTime', () => {
  it('formats UTC ISO string in local wall time shape YYYY-MM-DD HH:mm:ss', () => {
    const s = formatLocalDateTime('2026-04-18T08:30:45.000000Z')
    expect(s).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  })

  it('returns em dash for null/empty', () => {
    expect(formatLocalDateTime(null)).toBe('—')
    expect(formatLocalDateTime(undefined)).toBe('—')
    expect(formatLocalDateTime('')).toBe('—')
  })
})
