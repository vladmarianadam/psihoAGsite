/**
 * Formatare pentru afișare, exclusiv cu `Intl` și locale `ro-RO`.
 * Toate funcțiile tolerează `null` / `undefined` și nu aruncă niciodată.
 */

const defaultDateOptions: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}

const dateTimeOptions: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}

const priceFormatter = new Intl.NumberFormat('ro-RO', {
  style: 'currency',
  currency: 'RON',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

/** Transformă un ISO string în `Date`, sau `null` dacă valoarea nu e utilizabilă. */
function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/** Ex.: `formatDateRo('2026-07-12T10:00:00')` → „12 iulie 2026”. */
export function formatDateRo(
  value: string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = parseDate(value)
  if (!date) return ''

  return new Intl.DateTimeFormat('ro-RO', options ?? defaultDateOptions).format(date)
}

/** Ex.: `formatDateTimeRo('2026-07-12T14:30:00')` → „12 iulie 2026, 14:30”. */
export function formatDateTimeRo(value: string | null | undefined): string {
  const date = parseDate(value)
  if (!date) return ''

  return new Intl.DateTimeFormat('ro-RO', dateTimeOptions).format(date)
}

/** Ex.: `formatPriceRo(250)` → „250 RON”. Întoarce `null` când prețul lipsește. */
export function formatPriceRo(value: number | null | undefined): string | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null

  return priceFormatter.format(value)
}
