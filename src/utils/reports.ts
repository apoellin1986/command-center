import type {
  AppDatabase,
  ISODate,
  MonthlyReport,
  WeeklyReport,
} from '../types'
import {
  calculateBestStreak,
  calculateDailyDisciplineScore,
  calculateWeeklyAverage,
  isDayLogged,
  pct,
  round1,
  scoreBand,
} from './calculations'
import {
  dateRange,
  endOfMonth,
  endOfWeek,
  formatMonthLabel,
  startOfMonth,
  startOfWeek,
  todayISO,
} from './date'

function scoresFor(db: AppDatabase, dates: ISODate[]): { date: ISODate; score: number }[] {
  return dates
    .filter((d) => d <= todayISO())
    .map((d) => ({
      date: d,
      score: calculateDailyDisciplineScore(db.dailyLogs[d], db.settings).score,
    }))
}

export function generateWeeklyReport(
  db: AppDatabase,
  anchor: ISODate = todayISO(),
): WeeklyReport {
  const weekStart = startOfWeek(anchor)
  const weekEnd = endOfWeek(anchor)
  const dates = dateRange(weekStart, weekEnd)
  const past = dates.filter((d) => d <= todayISO())

  const weights = past
    .map((d) => db.dailyLogs[d]?.weightKg)
    .filter((w): w is number => w != null)
  const startWeight = weights[0] ?? null
  const endWeight = weights[weights.length - 1] ?? null
  const avgWeight = weights.length
    ? round1(weights.reduce((a, b) => a + b, 0) / weights.length)
    : null

  const scores = scoresFor(db, dates)
  const disciplineScore = calculateWeeklyAverage(scores.map((s) => s.score))

  const taken = (field: 'creatine' | 'omega3') =>
    pct(past.filter((d) => db.dailyLogs[d]?.[field]).length, past.length)

  const proteinDays = past.filter((d) => db.dailyLogs[d]?.protein).length
  const weighIns = past.filter((d) => db.dailyLogs[d]?.weightKg != null).length

  const pushupTotal = past.reduce((a, d) => a + (db.dailyLogs[d]?.pushups ?? 0), 0)
  const futsalSessions = db.futsalSessions.filter((s) => dates.includes(s.date)).length
  const workoutSessions = db.workoutSessions.filter(
    (s) => dates.includes(s.date) && s.completed,
  ).length

  const ranked = [...scores].sort((a, b) => b.score - a.score)
  const bestDay = ranked[0]?.score > 0 ? ranked[0].date : null
  const worstDay = ranked.length ? ranked[ranked.length - 1].date : null

  // weakness / win
  const metrics: { label: string; value: number }[] = [
    { label: 'creatine', value: taken('creatine') },
    { label: 'omega 3', value: taken('omega3') },
    { label: 'water', value: pct(past.filter((d) => db.dailyLogs[d]?.waterTarget).length, past.length) },
    { label: 'push-ups', value: pct(past.filter((d) => (db.dailyLogs[d]?.pushups ?? 0) > 0).length, past.length) },
    { label: 'training', value: pct(past.filter((d) => db.dailyLogs[d]?.homeWorkout || db.dailyLogs[d]?.futsalPlayed).length, past.length) },
  ]
  const sortedM = [...metrics].sort((a, b) => a.value - b.value)
  const mainWeakness =
    !sortedM[0] || sortedM[0].value >= 80
      ? 'None — all strong'
      : `${cap(sortedM[0].label)} (${sortedM[0].value}%)`
  const mainWin = sortedM[sortedM.length - 1]
    ? `${cap(sortedM[sortedM.length - 1].label)} (${sortedM[sortedM.length - 1].value}%)`
    : '—'

  const focusNextWeek = buildFocus(sortedM[0]?.label, sortedM[0]?.value ?? 0, disciplineScore, weights)

  return {
    weekStart, weekEnd, startWeight, endWeight, avgWeight,
    weightChange: startWeight != null && endWeight != null ? round1(endWeight - startWeight) : null,
    disciplineScore,
    creatineCompliance: taken('creatine'),
    omega3Compliance: taken('omega3'),
    proteinDays, weighIns,
    pushupTotal, futsalSessions, workoutSessions,
    bestDay, worstDay, mainWeakness, mainWin, focusNextWeek,
  }
}

function buildFocus(weakest: string | undefined, weakestValue: number, score: number, weights: number[]): string {
  if (score < 50) return 'Simplify. Hit the required fields every single day next week.'
  // No real weakness yet — everything is high. Don't invent one.
  if (weakestValue >= 80) return 'No weak link this week. Hold the structure through the weekend.'
  if (weakest === 'water') return 'Water is your weak link. Hit the water target daily.'
  if (weakest === 'creatine') return 'Lock in creatine — it should be automatic by now.'
  if (weakest === 'training') return 'Add one more training session. Move every day.'
  if (weights.length < 2) return 'Log your weight more often so the trend is real.'
  return 'Hold structure. Protect your streak through the weekend.'
}

export function generateMonthlyReport(
  db: AppDatabase,
  anchor: ISODate = todayISO(),
): MonthlyReport {
  const start = startOfMonth(anchor)
  const end = endOfMonth(anchor)
  const dates = dateRange(start, end)
  const past = dates.filter((d) => d <= todayISO())
  const monthK = start.slice(0, 7)

  const weights = past
    .map((d) => db.dailyLogs[d]?.weightKg)
    .filter((w): w is number => w != null)
  const weightChange =
    weights.length >= 2 ? round1(weights[weights.length - 1] - weights[0]) : null

  const scores = scoresFor(db, dates).map((s) => s.score)
  const avgDisciplineScore = calculateWeeklyAverage(scores)
  const strongDays = scores.filter((s) => s >= 80).length
  const weakDays = scores.filter((s) => s < 40).length

  const taken = (field: 'creatine' | 'omega3') =>
    pct(past.filter((d) => db.dailyLogs[d]?.[field]).length, past.length)

  const pushupTotal = past.reduce((a, d) => a + (db.dailyLogs[d]?.pushups ?? 0), 0)
  const futsalSessions = db.futsalSessions.filter((s) => dates.includes(s.date)).length
  const workoutSessions = db.workoutSessions.filter(
    (s) => dates.includes(s.date) && s.completed,
  ).length

  const loggedPredicate = (d: ISODate) => isDayLogged(db.dailyLogs[d])
  const bestStreak = calculateBestStreak(dates, loggedPredicate)
  const missedLoggingDays = past.filter((d) => !loggedPredicate(d)).length

  return {
    monthKey: monthK,
    label: formatMonthLabel(monthK),
    weightChange,
    avgDisciplineScore,
    creatineCompliance: taken('creatine'),
    omega3Compliance: taken('omega3'),
    pushupTotal, futsalSessions, workoutSessions,
    bestStreak, missedLoggingDays, strongDays, weakDays,
    verdict: buildVerdict(avgDisciplineScore, weightChange, missedLoggingDays, taken('creatine')),
  }
}

function buildVerdict(
  score: number,
  weightChange: number | null,
  missed: number,
  creatine: number,
): string {
  const band = scoreBand(score)
  if (band === 'Strong' && (weightChange ?? 0) <= 0) {
    return 'Excellent month. Keep structure — momentum is on your side.'
  }
  if (band === 'Decent' || band === 'Strong') {
    if (missed > 4) return 'Good effort, but missed logging is hiding your real progress.'
    if ((weightChange ?? 0) > 0) return 'Weight trend is wrong direction. Training is fine — fix the kitchen.'
    return 'Solid month. Sharpen the weak habit and push for Strong.'
  }
  if (band === 'Weak') {
    if (creatine < 50) return 'Inconsistent. Start with the basics: creatine + water, every day.'
    return 'Below standard. Simplify and rebuild the daily routine.'
  }
  return 'Poor consistency. Simplify and restart. One required field at a time.'
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
