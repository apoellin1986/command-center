import type { ISODate } from '../types'

/** Local 'YYYY-MM-DD' (never UTC — we track local days). */
export function toISO(d: Date): ISODate {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayISO(): ISODate {
  return toISO(new Date())
}

export function parseISO(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function addDays(s: ISODate, n: number): ISODate {
  const d = parseISO(s)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

export function daysBetween(a: ISODate, b: ISODate): number {
  const ms = parseISO(b).getTime() - parseISO(a).getTime()
  return Math.round(ms / 86400000)
}

export function isFuture(s: ISODate): boolean {
  return daysBetween(todayISO(), s) > 0
}

export function isToday(s: ISODate): boolean {
  return s === todayISO()
}

/** Monday-based week start. */
export function startOfWeek(s: ISODate): ISODate {
  const d = parseISO(s)
  const dow = (d.getDay() + 6) % 7 // 0 = Monday
  return addDays(s, -dow)
}

export function endOfWeek(s: ISODate): ISODate {
  return addDays(startOfWeek(s), 6)
}

export function startOfMonth(s: ISODate): ISODate {
  const d = parseISO(s)
  return toISO(new Date(d.getFullYear(), d.getMonth(), 1))
}

export function endOfMonth(s: ISODate): ISODate {
  const d = parseISO(s)
  return toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0))
}

export function monthKey(s: ISODate): string {
  return s.slice(0, 7)
}

/** Inclusive list of ISO dates from `start` to `end`. */
export function dateRange(start: ISODate, end: ISODate): ISODate[] {
  const out: ISODate[] = []
  let cur = start
  let guard = 0
  while (cur <= end && guard < 4000) {
    out.push(cur)
    cur = addDays(cur, 1)
    guard++
  }
  return out
}

/** The last `n` days ending today (oldest first). */
export function lastNDays(n: number, end: ISODate = todayISO()): ISODate[] {
  return dateRange(addDays(end, -(n - 1)), end)
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function formatLong(s: ISODate): string {
  const d = parseISO(s)
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`
}

export function formatShort(s: ISODate): string {
  const d = parseISO(s)
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`
}

export function formatMonthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return `${MONTHS[(m ?? 1) - 1]} ${y}`
}

export function weekdayShort(s: ISODate): string {
  return WEEKDAYS[parseISO(s).getDay()]
}

export function weekdayIndexMon(s: ISODate): number {
  return (parseISO(s).getDay() + 6) % 7 // 0 = Monday
}
