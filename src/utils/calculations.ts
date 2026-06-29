import type {
  DailyLog,
  FutsalSession,
  GoalSettings,
  ISODate,
  RequiredField,
  WeightEntry,
} from '../types'
import {
  addDays,
  daysBetween,
  parseISO,
  todayISO,
} from './date'

// ---------------------------------------------------------------------------
// Discipline score
// ---------------------------------------------------------------------------

export interface ScoreBreakdown {
  weight: number
  creatine: number
  vitamins: number
  pushups: number
  water: number
  training: number
  notes: number
}

const RAW_MAX = 90 // sum of weights below; normalised to /100

/** 0–100 discipline score for a single day. */
export function calculateDailyDisciplineScore(
  log: DailyLog | undefined,
  settings: GoalSettings,
): { score: number; breakdown: ScoreBreakdown } {
  const empty: ScoreBreakdown = {
    weight: 0, creatine: 0, vitamins: 0, pushups: 0,
    water: 0, training: 0, notes: 0,
  }
  if (!log) return { score: 0, breakdown: empty }

  const target = Math.max(1, settings.dailyPushupTarget)
  const pushRatio = log.pushups != null ? Math.min(1, log.pushups / target) : 0

  const breakdown: ScoreBreakdown = {
    weight: log.weightKg != null ? 15 : 0,
    creatine: log.creatine ? 15 : 0,
    vitamins: log.vitamins ? 5 : 0,
    pushups: Math.round(pushRatio * 15),
    water: log.waterTarget ? 15 : 0,
    training: log.homeWorkout || log.futsalPlayed ? 15 : 0,
    notes: log.notes.trim().length > 0 ? 10 : 0,
  }
  const raw =
    breakdown.weight + breakdown.creatine + breakdown.vitamins +
    breakdown.pushups + breakdown.water + breakdown.training + breakdown.notes
  return { score: Math.round((raw / RAW_MAX) * 100), breakdown }
}

export type ScoreBand = 'Poor' | 'Weak' | 'Decent' | 'Strong'

export function scoreBand(score: number): ScoreBand {
  if (score >= 80) return 'Strong'
  if (score >= 60) return 'Decent'
  if (score >= 40) return 'Weak'
  return 'Poor'
}

export function scoreVerdict(score: number): string {
  if (score >= 80) return 'Strong day.'
  if (score >= 60) return 'Decent, but not enough.'
  if (score >= 40) return 'Weak. Tighten up tomorrow.'
  return 'Poor day. Reset tomorrow.'
}

export function scoreColor(score: number): 'good' | 'warn' | 'bad' {
  if (score >= 80) return 'good'
  if (score >= 50) return 'warn'
  return 'bad'
}

export function calculateWeeklyAverage(scores: number[]): number {
  if (!scores.length) return 0
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

export const calculateMonthlyAverage = calculateWeeklyAverage

// ---------------------------------------------------------------------------
// Day completion
// ---------------------------------------------------------------------------

export function isFieldSatisfied(log: DailyLog, field: RequiredField): boolean {
  switch (field) {
    case 'creatine': return log.creatine
    case 'vitamins': return log.vitamins
    case 'pushups': return (log.pushups ?? 0) > 0
    case 'waterTarget': return log.waterTarget
    case 'weightKg': return log.weightKg != null
  }
}

export function isDayComplete(log: DailyLog | undefined, settings: GoalSettings): boolean {
  if (!log) return false
  return settings.requiredFields.every((f) => isFieldSatisfied(log, f))
}

/** A day "counts" for logging-streak purposes if it has any meaningful entry. */
export function isDayLogged(log: DailyLog | undefined): boolean {
  if (!log) return false
  return (
    log.weightKg != null ||
    log.creatine ||
    log.vitamins ||
    (log.pushups ?? 0) > 0 ||
    log.waterTarget ||
    log.futsalPlayed ||
    log.homeWorkout ||
    log.notes.trim().length > 0
  )
}

// ---------------------------------------------------------------------------
// Streaks (generic over a per-date predicate)
// ---------------------------------------------------------------------------

/** Counts back from `end` while predicate holds. */
export function calculateCurrentStreak(
  predicate: (date: ISODate) => boolean,
  end: ISODate = todayISO(),
): number {
  let streak = 0
  let cur = end
  // Allow today to be "not yet done" without breaking the streak.
  if (!predicate(cur)) cur = addDays(cur, -1)
  let guard = 0
  while (predicate(cur) && guard < 4000) {
    streak++
    cur = addDays(cur, -1)
    guard++
  }
  return streak
}

export function calculateBestStreak(
  dates: ISODate[],
  predicate: (date: ISODate) => boolean,
): number {
  let best = 0
  let run = 0
  for (const d of dates) {
    if (predicate(d)) {
      run++
      best = Math.max(best, run)
    } else {
      run = 0
    }
  }
  return best
}

// ---------------------------------------------------------------------------
// Weight
// ---------------------------------------------------------------------------

export function weightEntriesFromLogs(
  logs: Record<ISODate, DailyLog>,
): WeightEntry[] {
  return Object.values(logs)
    .filter((l) => l.weightKg != null)
    .map((l) => ({ date: l.date, weightKg: l.weightKg as number }))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
}

export interface MovingAveragePoint {
  date: ISODate
  weight: number | null
  avg: number | null
}

/** 7-day moving average aligned to actual entry dates. */
export function calculateSevenDayMovingAverage(
  entries: WeightEntry[],
  window = 7,
): MovingAveragePoint[] {
  return entries.map((e, i) => {
    const from = parseISO(addDays(e.date, -(window - 1)))
    const slice = entries.filter((x, j) => j <= i && parseISO(x.date) >= from)
    const avg =
      slice.reduce((a, b) => a + b.weightKg, 0) / Math.max(1, slice.length)
    return { date: e.date, weight: e.weightKg, avg: round1(avg) }
  })
}

export type TrendStatus = 'ahead' | 'on-track' | 'slightly-behind' | 'seriously-behind' | 'no-data'

export interface WeightTrend {
  entries: number
  startWeight: number | null
  currentWeight: number | null
  currentAvg: number | null
  best: number | null
  worst: number | null
  totalLost: number | null
  remaining: number | null
  avgWeeklyChange: number | null
  recentWeeklyChange: number | null
  requiredWeeklyLoss: number | null
  daysRemaining: number
  projectedDate: ISODate | null
  status: TrendStatus
  statusColor: 'good' | 'warn' | 'bad'
  statusLabel: string
}

export function calculateWeightTrend(
  entries: WeightEntry[],
  settings: GoalSettings,
): WeightTrend {
  const today = todayISO()
  const daysRemaining = Math.max(0, daysBetween(today, settings.targetDate))

  if (!entries.length) {
    return {
      entries: 0, startWeight: settings.startWeightKg, currentWeight: null,
      currentAvg: null, best: null, worst: null, totalLost: null,
      remaining: round1(settings.startWeightKg - settings.targetWeightKg),
      avgWeeklyChange: null, recentWeeklyChange: null,
      requiredWeeklyLoss: null, daysRemaining, projectedDate: null,
      status: 'no-data', statusColor: 'warn', statusLabel: 'No data yet',
    }
  }

  const ma = calculateSevenDayMovingAverage(entries)
  const first = entries[0]
  const last = entries[entries.length - 1]
  const currentAvg = ma[ma.length - 1].avg ?? last.weightKg
  const start = settings.startWeightKg || first.weightKg

  const best = Math.min(...entries.map((e) => e.weightKg))
  const worst = Math.max(...entries.map((e) => e.weightKg))
  const totalLost = round1(start - currentAvg)
  const remaining = round1(currentAvg - settings.targetWeightKg)

  const spanDays = Math.max(1, daysBetween(first.date, last.date))
  const avgWeeklyChange = round2(((last.weightKg - first.weightKg) / spanDays) * 7)

  // recent: avg now vs avg ~7 days ago
  const weekAgo = addDays(last.date, -7)
  const prior = ma.filter((p) => p.date <= weekAgo)
  const recentWeeklyChange =
    prior.length && currentAvg != null
      ? round2(currentAvg - (prior[prior.length - 1].avg ?? currentAvg))
      : avgWeeklyChange

  const weeksRemaining = Math.max(0.1, daysRemaining / 7)
  const requiredWeeklyLoss =
    remaining > 0 ? round2(remaining / weeksRemaining) : 0

  // projection from recent rate
  const rate = recentWeeklyChange ?? avgWeeklyChange // kg/week (negative = losing)
  let projectedDate: ISODate | null = null
  if (rate < -0.01 && remaining > 0) {
    const weeksNeeded = remaining / Math.abs(rate)
    projectedDate = addDays(last.date, Math.round(weeksNeeded * 7))
  }

  const { status, statusColor, statusLabel } = classifyTrend(
    rate,
    requiredWeeklyLoss,
    remaining,
  )

  return {
    entries: entries.length, startWeight: round1(start),
    currentWeight: round1(last.weightKg), currentAvg: round1(currentAvg),
    best: round1(best), worst: round1(worst), totalLost, remaining,
    avgWeeklyChange, recentWeeklyChange, requiredWeeklyLoss,
    daysRemaining, projectedDate, status, statusColor, statusLabel,
  }
}

function classifyTrend(
  rate: number, // kg/week, negative = losing
  required: number, // kg/week needed (positive)
  remaining: number,
): { status: TrendStatus; statusColor: 'good' | 'warn' | 'bad'; statusLabel: string } {
  if (remaining <= 0) {
    return { status: 'ahead', statusColor: 'good', statusLabel: 'Target reached — hold the line' }
  }
  const loss = -rate // positive when losing
  if (required <= 0) {
    return { status: 'on-track', statusColor: 'good', statusLabel: 'On track' }
  }
  if (loss >= required * 1.1) {
    return { status: 'ahead', statusColor: 'good', statusLabel: 'Ahead of target' }
  }
  if (loss >= required * 0.85) {
    return { status: 'on-track', statusColor: 'good', statusLabel: 'On track' }
  }
  if (loss >= required * 0.45) {
    return { status: 'slightly-behind', statusColor: 'warn', statusLabel: 'Slightly behind' }
  }
  return { status: 'seriously-behind', statusColor: 'bad', statusLabel: 'Seriously behind' }
}

// ---------------------------------------------------------------------------
// Supplements
// ---------------------------------------------------------------------------

export interface SupplementStats {
  weeklyCompliance: number
  monthlyCompliance: number
  currentStreak: number
  bestStreak: number
  missedThisMonth: number
}

export function calculateSupplementCompliance(
  logs: Record<ISODate, DailyLog>,
  getTaken: (log: DailyLog) => boolean,
  weekDates: ISODate[],
  monthDates: ISODate[],
  allDates: ISODate[],
): SupplementStats {
  const taken = (d: ISODate) => {
    const l = logs[d]
    return l ? getTaken(l) : false
  }
  const past = (dates: ISODate[]) => dates.filter((d) => d <= todayISO())
  const wk = past(weekDates)
  const mo = past(monthDates)

  return {
    weeklyCompliance: pct(wk.filter(taken).length, wk.length),
    monthlyCompliance: pct(mo.filter(taken).length, mo.length),
    currentStreak: calculateCurrentStreak(taken),
    bestStreak: calculateBestStreak(allDates, taken),
    missedThisMonth: mo.filter((d) => !taken(d)).length,
  }
}

// ---------------------------------------------------------------------------
// Push-ups
// ---------------------------------------------------------------------------

export interface PushupStats {
  today: number
  weekTotal: number
  monthTotal: number
  bestDay: number
  bestDayDate: ISODate | null
  currentStreak: number
  bestStreak: number
  sevenDayAvg: number
}

export function calculatePushupStats(
  logs: Record<ISODate, DailyLog>,
  weekDates: ISODate[],
  monthDates: ISODate[],
  allDates: ISODate[],
): PushupStats {
  const get = (d: ISODate) => logs[d]?.pushups ?? 0
  const sum = (dates: ISODate[]) => dates.reduce((a, d) => a + get(d), 0)

  let bestDay = 0
  let bestDayDate: ISODate | null = null
  for (const d of allDates) {
    if (get(d) > bestDay) {
      bestDay = get(d)
      bestDayDate = d
    }
  }

  const last7 = allDates.filter((d) => d > addDays(todayISO(), -7) && d <= todayISO())
  const did = (d: ISODate) => get(d) > 0

  return {
    today: get(todayISO()),
    weekTotal: sum(weekDates.filter((d) => d <= todayISO())),
    monthTotal: sum(monthDates.filter((d) => d <= todayISO())),
    bestDay,
    bestDayDate,
    currentStreak: calculateCurrentStreak(did),
    bestStreak: calculateBestStreak(allDates, did),
    sevenDayAvg: Math.round(sum(last7) / Math.max(1, Math.min(7, last7.length))),
  }
}

// ---------------------------------------------------------------------------
// Futsal
// ---------------------------------------------------------------------------

export interface FutsalStats {
  thisWeek: number
  thisMonth: number
  total: number
  daysSinceLast: number | null
  avgPerformance: number | null
  avgHydration: number | null
  recoveryWarning: boolean
}

export function calculateFutsalStats(
  sessions: FutsalSession[],
  weekDates: ISODate[],
  monthDates: ISODate[],
): FutsalStats {
  const inWeek = sessions.filter((s) => weekDates.includes(s.date))
  const inMonth = sessions.filter((s) => monthDates.includes(s.date))
  const sorted = [...sessions].sort((a, b) => (a.date < b.date ? 1 : -1))
  const last = sorted[0]

  const avg = (arr: number[]) =>
    arr.length ? round1(arr.reduce((a, b) => a + b, 0) / arr.length) : null

  const highIntensityThisWeek = inWeek.filter((s) => s.intensity === 'High').length
  const lowEnergyThisWeek = inWeek.filter((s) => s.energyBefore <= 2).length

  return {
    thisWeek: inWeek.length,
    thisMonth: inMonth.length,
    total: sessions.length,
    daysSinceLast: last ? daysBetween(last.date, todayISO()) : null,
    avgPerformance: avg(sessions.map((s) => s.performance)),
    avgHydration: avg(sessions.map((s) => s.hydration)),
    recoveryWarning:
      inWeek.length >= 3 || (highIntensityThisWeek >= 2 && lowEnergyThisWeek >= 1),
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function pct(n: number, d: number): number {
  if (d <= 0) return 0
  return Math.round((n / d) * 100)
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function age(birthDate: ISODate, on: ISODate = todayISO()): number {
  const b = parseISO(birthDate)
  const o = parseISO(on)
  let a = o.getFullYear() - b.getFullYear()
  const m = o.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && o.getDate() < b.getDate())) a--
  return a
}
