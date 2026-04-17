import { describe, expect, it } from 'vitest'

import { centsToDollarsString, dollarsToCents } from './money'

describe('money', () => {
  it('parses dollar strings to cents', () => {
    expect(dollarsToCents('12.99')).toBe(1299)
    expect(dollarsToCents(' 0 ')).toBe(0)
    expect(dollarsToCents('1,234.50')).toBe(123450)
  })

  it('rejects invalid amounts', () => {
    expect(dollarsToCents('')).toBeNull()
    expect(dollarsToCents('abc')).toBeNull()
    expect(dollarsToCents('-1')).toBeNull()
  })

  it('formats cents to dollars', () => {
    expect(centsToDollarsString(1299)).toBe('12.99')
    expect(centsToDollarsString(0)).toBe('0.00')
  })
})
