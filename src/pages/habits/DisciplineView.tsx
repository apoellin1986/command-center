import { useMemo } from 'react'
import { useStore } from '../../storage/StoreContext'
import { useRanges } from '../../hooks/useRanges'
import StatCard from '../../components/StatCard'
import BarChartSimple from '../../components/BarChartSimple'
import CalendarHeatmap from '../../components/CalendarHeatmap'
import {
  calculateBestStreak,
  calculateCurrentStreak,
  calculateDailyDisciplineScore,
  calculateWeeklyAverage,
  isDayComplete,
  isDayLogged,
  scoreColor,
} from '../../utils/calculations'
import { lastNDays, todayISO } from '../../utils/date'

export default function DisciplineView() {
  const { db } = useStore()
  const ranges = useRanges()
  const settings = db.settings
  const today = todayISO()

  const data = useMemo(() => {
    const score = (d: string) => calculateDailyDisciplineScore(db.dailyLogs[d], settings).score
    const todayScore = score(today)
    const weekScores = ranges.week.filter((d) => d <= today).map(score)
    const monthScores = ranges.month.filter((d) => d <= today).map(score)
    const chart = lastNDays(30).map((d) => ({ date: d, value: score(d) }))

    return {
      todayScore,
      weekAvg: calculateWeeklyAverage(weekScores),
      monthAvg: calculateWeeklyAverage(monthScores),
      perfectStreak: calculateCurrentStreak((d) => isDayComplete(db.dailyLogs[d], settings)),
      loggingStreak: calculateCurrentStreak((d) => isDayLogged(db.dailyLogs[d])),
      // full history — a best streak shouldn't expire after 120 days
      bestLoggingStreak: calculateBestStreak(ranges.all, (d) => isDayLogged(db.dailyLogs[d])),
      strongDays: monthScores.filter((s) => s >= 80).length,
      poorDays: monthScores.filter((s) => s < 40).length,
      chart,
    }
  }, [db.dailyLogs, settings, ranges, today])

  const level = (score: number) => {
    if (score === 0) return 0
    if (score < 40) return 1
    if (score < 60) return 2
    if (score < 80) return 3
    return 4
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Today" value={data.todayScore} tone={scoreColor(data.todayScore)} />
        <StatCard label="Week avg" value={data.weekAvg} tone={scoreColor(data.weekAvg)} />
        <StatCard label="Month avg" value={data.monthAvg} tone={scoreColor(data.monthAvg)} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Perfect streak" value={data.perfectStreak} sub="complete days" tone={data.perfectStreak > 0 ? 'good' : 'neutral'} />
        <StatCard label="Logging streak" value={data.loggingStreak} sub={`best ${data.bestLoggingStreak}`} />
        <StatCard label="Strong days" value={data.strongDays} sub={`${data.poorDays} poor`} tone={data.strongDays > data.poorDays ? 'good' : 'warn'} />
      </div>

      <div className="card">
        <h3 className="mb-2 text-sm font-semibold text-zinc-300">Discipline score — last 30 days</h3>
        <BarChartSimple
          data={data.chart}
          colorFor={(d) => (d.value >= 80 ? '#22c55e' : d.value >= 50 ? '#f59e0b' : d.value > 0 ? '#ef4444' : '#3f3f46')}
          emptyMessage="No scores yet."
        />
      </div>

      <div className="card">
        <h3 className="mb-2 text-sm font-semibold text-zinc-300">This month</h3>
        <CalendarHeatmap monthAnchor={today} getLevel={(d) => level(calculateDailyDisciplineScore(db.dailyLogs[d], settings).score)} colorClass="bg-accent" />
        <p className="mt-2 text-xs text-zinc-500">Darker = stronger day. Empty = unlogged.</p>
      </div>
    </div>
  )
}
