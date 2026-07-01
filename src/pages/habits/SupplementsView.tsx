import { useMemo } from 'react'
import type { DailyLog } from '../../types'
import { useStore } from '../../storage/StoreContext'
import { useRanges } from '../../hooks/useRanges'
import StatCard from '../../components/StatCard'
import ProgressBar from '../../components/ProgressBar'
import CalendarHeatmap from '../../components/CalendarHeatmap'
import { calculateSupplementCompliance } from '../../utils/calculations'
import { todayISO } from '../../utils/date'

interface SuppDef {
  id: string
  name: string
  get: (l: DailyLog) => boolean
}

function warning(weekly: number, current: number, missed: number, name: string): { text: string; tone: 'good' | 'warn' | 'bad' } | null {
  if (weekly < 60) return { text: `${name} consistency is poor this week.`, tone: 'bad' }
  if (missed >= 3) return { text: `You missed ${name.toLowerCase()} ${missed} days this month.`, tone: 'warn' }
  if (current >= 5) return { text: `Good streak — ${current} days. Do not break it.`, tone: 'good' }
  return null
}

function SupplementCard({ def }: { def: SuppDef }) {
  const { db } = useStore()
  const ranges = useRanges()
  const stats = useMemo(
    () =>
      calculateSupplementCompliance(
        db.dailyLogs,
        def.get,
        ranges.week,
        ranges.month,
        ranges.all,
      ),
    [db.dailyLogs, def, ranges],
  )
  const warn = warning(stats.weeklyCompliance, stats.currentStreak, stats.missedThisMonth, def.name)

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{def.name}</h3>
        <span className={`pill ${stats.weeklyCompliance >= 70 ? 'bg-good/20 text-good' : 'bg-bad/20 text-bad'}`}>
          {stats.weeklyCompliance}% this week
        </span>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs text-zinc-400">
          <span>Monthly compliance</span>
          <span>{stats.monthlyCompliance}%</span>
        </div>
        <ProgressBar value={stats.monthlyCompliance} tone={stats.monthlyCompliance >= 70 ? 'good' : stats.monthlyCompliance >= 50 ? 'warn' : 'bad'} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Streak" value={stats.currentStreak} sub="days" tone={stats.currentStreak > 0 ? 'good' : 'neutral'} />
        <StatCard label="Best" value={stats.bestStreak} sub="days" />
        <StatCard label="Missed" value={stats.missedThisMonth} sub="this month" tone={stats.missedThisMonth > 2 ? 'bad' : 'neutral'} />
      </div>

      <div>
        <p className="field-label mb-2">This month</p>
        <CalendarHeatmap
          monthAnchor={todayISO()}
          getLevel={(d) => (db.dailyLogs[d] && def.get(db.dailyLogs[d]) ? 4 : 0)}
        />
      </div>

      {warn && (
        <div
          className={`rounded-xl border p-3 text-sm ${
            warn.tone === 'good'
              ? 'border-good/40 bg-good/10 text-good'
              : warn.tone === 'warn'
                ? 'border-warn/40 bg-warn/10 text-warn'
                : 'border-bad/40 bg-bad/10 text-bad'
          }`}
        >
          {warn.text}
        </div>
      )}
    </div>
  )
}

export default function SupplementsView() {
  const { db } = useStore()
  const defs: SuppDef[] = [
    { id: 'creatine', name: 'Creatine', get: (l) => l.creatine },
    { id: 'omega3', name: 'Omega 3', get: (l) => l.omega3 },
    { id: 'protein', name: 'Protein shake', get: (l) => l.protein },
    ...db.settings.customSupplements
      .filter((s) => s.enabled)
      .map((s) => ({ id: s.id, name: s.name, get: (l: DailyLog) => !!l.customSupplements[s.id] })),
  ]
  return (
    <div className="flex flex-col gap-4">
      {defs.map((d) => (
        <SupplementCard key={d.id} def={d} />
      ))}
    </div>
  )
}
