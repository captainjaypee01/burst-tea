/**
 * Display currency for the POS UI. Replace `getCurrencyCode` / `getCurrencyLocale` with
 * settings from the API when a **Settings** module exists (e.g. store preferences).
 */
export const DEFAULT_CURRENCY_CODE = 'PHP'
export const DEFAULT_CURRENCY_LOCALE = 'en-PH'

export function getCurrencyCode(): string {
  return DEFAULT_CURRENCY_CODE
}

export function getCurrencyLocale(): string {
  return DEFAULT_CURRENCY_LOCALE
}

/** Format integer cents as money in the configured currency (default Philippine peso). */
export function formatMoneyCents(cents: number): string {
  return new Intl.NumberFormat(getCurrencyLocale(), {
    style: 'currency',
    currency: getCurrencyCode(),
  }).format(cents / 100)
}
