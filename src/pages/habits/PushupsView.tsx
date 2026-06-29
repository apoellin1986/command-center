import { useMemo } from 'react'
import { useStore } from '../../storage/StoreContext'
import { useRanges } from '../../hooks/useRanges'
import StatCard from '../../components/StatCard'
import ProgressBar from '../../components/ProgressBar'
import BarChartSimple from '../../components/BarChartSimple'
import { calculatePushupStats } from '../../utils/calculations'
import { addDays, formatShort, lastNDays, todayISO } from '../../utils/date'

export default function PushupsView() {
  const { db } = useStore()
  const ranges = useRanges()
  const settings = db.settings
  const today = todayISO()

  const stats = useMemo(
    () => calculatePushupStats(db.dailyLogs, ranges.week, ranges.month, ranges.all),
    [db.dailyLogs, ranges],
  )

  const chartData = useMemo(
    () => lastNDays(30).map((d) => ({ date: d, value: db.dailyLogs[d]?.pushups ?? 0 })),
    [db.dailyLogs],
  )

  // Challenge mode
  const target = settings.monthlyPushupTarget
  const completed = stats.monthTotal
  const remaining = Math.max(0, target - completed)
  const monthEndDate = ranges.month[ranges.month.length - 1]
  const daysLeft = Math.max(1, ranges.month.filter((d) => d >= today).length)
  const perDay = Math.ceil(remaining / daysLeft)
  const pct = target > 0 ? (completed / target) * 100 : 0

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Today" value={stats.today} sub={`target ${settings.dailyPushupTarget}`} tone={stats.today >= settings.dailyPushupTarget ? 'good' : 'neutral'} />
        <StatCard label="7-day avg" value={stats.sevenDayAvg} sub="per day" />
        <StatCard label="Week total" value={stats.weekTotal} />
        <StatCard label="Month total" value={stats.monthTotal} />
        <StatCard label="Best day" value={stats.bestDay} sub={stats.bestDayDate ? formatShort(stats.bestDayDate) : '—'} tone="good" />
        <StatCard label="Current streak" value={stats.currentStreak} sub={`best ${stats.bestStreak}`} tone={stats.currentStreak > 0 ? 'good' : 'neutral'} />
      </div>

      {/* Challenge mode */}
      <div className="card">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Monthly challenge</h3>
          <span className="pill bg-accent/20 text-accent">{Math.round(pct)}%</span>
        </div>
        <ProgressBar value={pct} tone={pct >= 100 ? 'good' : 'accent'} height={12} />
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xl font-bold">{completed}</p>
            <p className="text-xs text-zinc-400">done</p>
          </div>
          <div>
            <p className="text-xl font-bold">{remaining}</p>
            <p className="text-xs text-zinc-400">remaining</p>
          </div>
          <div>
            <p className="text-xl font-bold text-accent">{remaining > 0 ? perDay : 0}</p>
            <p className="text-xs text-zinc-400">/day to finish</p>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-zinc-500">
          {remaining > 0
            ? `Target ${target} by ${formatShort(monthEndDate)}. ${daysLeft} days left.`
            : 'Monthly target smashed. Raise it in Settings.'}
        </p>
      </div>

      <div className="card">
        <h3 className="mb-2 text-sm font-semibold text-zinc-300">Last 30 days</h3>
        <BarChartSimple
          data={chartData}
          unit=" reps"
          colorFor={(d) => (d.value >= settings.dailyPushupTarget ? '#22c55e' : '#3b82f6')}
          emptyMessage="No push-ups logged yet. Drop and give me some."
        />
        <p className="mt-2 text-xs text-zinc-500">
          Green bars hit your daily target of {settings.dailyPushupTarget}. Since {formatShort(addDays(today, -29))}.
        </p>
      </div>
    </div>
  )
}
