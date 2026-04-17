import { describe, expect, it } from 'vitest'

import { DEFAULT_CURRENCY_CODE, formatMoneyCents, getCurrencyCode } from './currency'

describe('currency', () => {
  it('defaults to Philippine peso until settings exist', () => {
    expect(getCurrencyCode()).toBe(DEFAULT_CURRENCY_CODE)
  })

  it('formats cents with PHP', () => {
    const s = formatMoneyCents(1299)
    expect(s).toMatch(/12\.99/)
    expect(s).toMatch(/PHP|₱/)
  })
})
