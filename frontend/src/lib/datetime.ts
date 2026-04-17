/**
 * Format an ISO 8601 instant (UTC from API) as local wall time `YYYY-MM-DD HH:mm:ss`.
 */
export function formatLocalDateTime(iso: string | null | undefined): string {
  if (iso == null || iso === '') {
    return '—'
  }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return '—'
  }
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}:${s}`
}
