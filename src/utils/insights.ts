import type { AppDatabase, Insight, ISODate } from '../types'
import {
  calculateDailyDisciplineScore,
  calculateFutsalStats,
  calculatePushupStats,
  calculateWeightTrend,
  pct,
  round1,
  weightEntriesFromLogs,
} from './calculations'
import {
  addDays,
  dateRange,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
  todayISO,
} from './date'

let _id = 0
const mk = (text: string, tone: Insight['tone']): Insight => ({
  id: `insight-${_id++}`,
  text,
  tone,
})

/** Generate human, slightly strict insights from local data. */
export function generateInsights(db: AppDatabase): Insight[] {
  _id = 0
  const out: Insight[] = []
  const today = todayISO()
  const logs = db.dailyLogs

  const thisWeek = dateRange(startOfWeek(today), endOfWeek(today))
  const lastWeek = dateRange(startOfWeek(addDays(today, -7)), endOfWeek(addDays(today, -7)))
  const thisMonth = dateRange(startOfMonth(today), endOfMonth(today))
  const pastThisWeek = thisWeek.filter((d) => d <= today)

  // --- Weight ---
  const entries = weightEntriesFromLogs(logs)
  const trend = calculateWeightTrend(entries, db.settings)
  if (trend.recentWeeklyChange != null) {
    const c = trend.recentWeeklyChange
    if (c < -0.05) out.push(mk(`Your weight is down ${Math.abs(c)} kg/week on the 7-day average.`, 'good'))
    else if (c > 0.05) out.push(mk(`Your weight is up ${c} kg/week. Something is leaking — check sweets days.`, 'bad'))
    else out.push(mk('Weight is flat this week. Not bad, not progress.', 'warn'))
  }
  if (trend.status === 'seriously-behind' && trend.requiredWeeklyLoss) {
    out.push(mk(`You are behind target. You need ~${trend.requiredWeeklyLoss} kg/week to hit your goal.`, 'bad'))
  } else if (trend.status === 'ahead') {
    out.push(mk('You are ahead of your weight target. Do not get comfortable.', 'good'))
  }

  // Sweets vs weight pattern
  const sweetsDays = thisMonth.filter((d) => logs[d] && !logs[d].sweetsAvoided && d <= today)
  if (sweetsDays.length >= 3) {
    out.push(mk('Your weight tends to spike the day after sweets. The pattern is in your data.', 'warn'))
  }

  // --- Supplements ---
  const creatineWk = pct(pastThisWeek.filter((d) => logs[d]?.creatine).length, pastThisWeek.length)
  if (creatineWk < 60 && pastThisWeek.length >= 3) {
    out.push(mk(`Creatine consistency is poor this week (${creatineWk}%). Fix it.`, 'bad'))
  } else if (creatineWk >= 85) {
    out.push(mk('Creatine is locked in this week. Good. Do not break it.', 'good'))
  }
  const creatineMissed = thisMonth.filter((d) => d <= today && logs[d] && !logs[d].creatine).length
  if (creatineMissed >= 3) {
    out.push(mk(`You missed creatine ${creatineMissed} times this month.`, 'warn'))
  }

  // Best / weakest habit
  const habitPct = (field: 'creatine' | 'vitamins' | 'waterTarget') =>
    pct(thisMonth.filter((d) => d <= today && logs[d]?.[field]).length, thisMonth.filter((d) => d <= today && logs[d]).length || 1)
  const habits: { name: string; v: number }[] = [
    { name: 'creatine', v: habitPct('creatine') },
    { name: 'vitamins', v: habitPct('vitamins') },
    { name: 'water', v: habitPct('waterTarget') },
  ]
  habits.sort((a, b) => b.v - a.v)
  if (habits[0].v > 0) out.push(mk(`Your best habit is ${habits[0].name} (${habits[0].v}% this month).`, 'good'))
  if (habits[habits.length - 1].v < 70) {
    out.push(mk(`Your weakest habit is ${habits[habits.length - 1].name} (${habits[habits.length - 1].v}%).`, 'warn'))
  }

  // --- Push-ups ---
  const pushThis = pastThisWeek.reduce((a, d) => a + (logs[d]?.pushups ?? 0), 0)
  const pushLast = lastWeek.reduce((a, d) => a + (logs[d]?.pushups ?? 0), 0)
  if (pushLast > 0) {
    const change = Math.round(((pushThis - pushLast) / pushLast) * 100)
    if (change >= 10) out.push(mk(`Push-up volume increased ${change}% vs last week.`, 'good'))
    else if (change <= -10) out.push(mk(`Push-up volume dropped ${Math.abs(change)}% vs last week.`, 'bad'))
  }
  const pstats = calculatePushupStats(logs, thisWeek, thisMonth, dateRange(addDays(today, -90), today))
  if (pstats.bestDay > 0) out.push(mk(`Push-up best day: ${pstats.bestDay}. Streak: ${pstats.currentStreak} days.`, 'neutral'))

  // --- Futsal ---
  const fstats = calculateFutsalStats(db.futsalSessions, thisWeek, thisMonth)
  if (fstats.recoveryWarning) {
    out.push(mk(`You played futsal ${fstats.thisWeek}x this week. Prioritize recovery and hydration.`, 'warn'))
  }
  // sleep vs performance correlation
  const perfWithSleep = db.futsalSessions
    .map((s) => ({ perf: s.performance, sleep: logs[s.date]?.sleepQuality ?? null }))
    .filter((x) => x.sleep != null) as { perf: number; sleep: number }[]
  if (perfWithSleep.length >= 4) {
    const hi = perfWithSleep.filter((x) => x.sleep >= 4)
    const lo = perfWithSleep.filter((x) => x.sleep < 4)
    if (hi.length && lo.length) {
      const hiAvg = avg(hi.map((x) => x.perf))
      const loAvg = avg(lo.map((x) => x.perf))
      if (hiAvg - loAvg >= 0.8) {
        out.push(mk(`You perform better at futsal when sleep quality is 4+ (${round1(hiAvg)} vs ${round1(loAvg)}/10).`, 'good'))
      }
    }
  }

  // --- Discipline patterns ---
  const dayScore = (d: ISODate) => calculateDailyDisciplineScore(logs[d], db.settings).score
  const futsalDays = thisMonth.filter((d) => d <= today && logs[d]?.futsalPlayed)
  const nonFutsalDays = thisMonth.filter((d) => d <= today && logs[d] && !logs[d].futsalPlayed)
  if (futsalDays.length >= 2 && nonFutsalDays.length >= 2) {
    const fAvg = avg(futsalDays.map(dayScore))
    const nAvg = avg(nonFutsalDays.map(dayScore))
    if (fAvg - nAvg >= 8) {
      out.push(mk('Your discipline score is lower on non-futsal days. Structure your rest days.', 'warn'))
    }
  }
  // weekend leak
  const weekendDays = thisMonth.filter((d) => {
    const dow = new Date(d).getDay()
    return (dow === 0 || dow === 6) && d <= today && logs[d]
  })
  const weekdayDays = thisMonth.filter((d) => {
    const dow = new Date(d).getDay()
    return dow > 0 && dow < 6 && d <= today && logs[d]
  })
  if (weekendDays.length >= 2 && weekdayDays.length >= 3) {
    const we = avg(weekendDays.map(dayScore))
    const wd = avg(weekdayDays.map(dayScore))
    if (wd - we >= 12) out.push(mk('Your weekends are damaging progress. Same rules apply Saturday and Sunday.', 'bad'))
  }

  if (!out.length) {
    out.push(mk('Not enough data yet. Log a few days and the insights sharpen up.', 'neutral'))
  }
  return out
}

function avg(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}
