export { formatMoneyCents } from './currency'

/** Parse a user-entered decimal amount (major units, e.g. PHP) into integer cents, or null if invalid. */
export function dollarsToCents(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, '')
  if (trimmed === '') {
    return null
  }
  const n = Number.parseFloat(trimmed)
  if (Number.isNaN(n) || n < 0) {
    return null
  }
  return Math.round(n * 100)
}

export function centsToDollarsString(cents: number): string {
  return (cents / 100).toFixed(2)
}
