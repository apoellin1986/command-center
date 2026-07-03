import type { FastingSession, GoalSettings, ISODate } from '../types'
import {
  calculateBestStreak,
  calculateCurrentStreak,
  round1,
} from './calculations'
import { toISO } from './date'

const HOUR = 3_600_000

export function getActiveFast(sessions: FastingSession[]): FastingSession | undefined {
  return sessions.find((s) => s.endAt == null)
}

/** Elapsed ms of a fast (uses `now` while it's still running). */
export function fastMs(s: FastingSession, now = Date.now()): number {
  return Math.max(0, (s.endAt ?? now) - s.startAt)
}

export function fastHours(s: FastingSession, now = Date.now()): number {
  return fastMs(s, now) / HOUR
}

/** A completed fast that reached its goal window. */
export function metGoal(s: FastingSession): boolean {
  return s.endAt != null && fastHours(s) >= s.goalHours
}

/** Fasts are attributed to the day they were broken (ended). */
export function endDateOf(s: FastingSession): ISODate | null {
  return s.endAt != null ? toISO(new Date(s.endAt)) : null
}

/** "16h 32m" — or with seconds while live. */
export function formatElapsed(ms: number, withSeconds = false): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (withSeconds) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
  return `${h}h ${String(m).padStart(2, '0')}m`
}

export function formatClock(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export interface FastingStats {
  currentStreak: number
  bestStreak: number
  longestHours: number
  avgHours: number | null // completed fasts
  totalCompleted: number
  thisWeek: number
  goalHitRate: number // % of completed fasts that met goal
}

export function calculateFastingStats(
  sessions: FastingSession[],
  weekDates: ISODate[],
  allDates: ISODate[],
): FastingStats {
  const completed = sessions.filter((s) => s.endAt != null)

  // A day "hits" if any completed fast that ended on it reached goal.
  const metOnDate = (d: ISODate) =>
    completed.some((s) => endDateOf(s) === d && metGoal(s))

  const durations = completed.map((s) => fastHours(s))
  const longestHours = durations.length ? Math.max(...durations) : 0
  const avgHours = durations.length
    ? round1(durations.reduce((a, b) => a + b, 0) / durations.length)
    : null

  const thisWeek = completed.filter((s) => {
    const d = endDateOf(s)
    return d != null && weekDates.includes(d)
  }).length

  const metCount = completed.filter(metGoal).length

  return {
    currentStreak: calculateCurrentStreak(metOnDate),
    bestStreak: calculateBestStreak(allDates, metOnDate),
    longestHours: round1(longestHours),
    avgHours,
    totalCompleted: completed.length,
    thisWeek,
    goalHitRate: completed.length ? Math.round((metCount / completed.length) * 100) : 0,
  }
}

export const PROTOCOLS: { label: string; hours: number }[] = [
  { label: '14:10', hours: 14 },
  { label: '16:8', hours: 16 },
  { label: '18:6', hours: 18 },
  { label: '20:4', hours: 20 },
  { label: 'OMAD', hours: 23 },
]

export function protocolLabel(settings: GoalSettings): string {
  return PROTOCOLS.find((p) => p.hours === settings.fastingGoalHours)?.label ?? `${settings.fastingGoalHours}h`
}
