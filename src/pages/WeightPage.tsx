import { useMemo, useState } from 'react'
import { useStore } from '../storage/StoreContext'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import WeightChart from '../components/WeightChart'
import ProgressBar from '../components/ProgressBar'
import {
  calculateSevenDayMovingAverage,
  calculateWeightTrend,
  round1,
  weightEntriesFromLogs,
} from '../utils/calculations'
import { formatShort, todayISO } from '../utils/date'

export default function WeightPage() {
  const { db, getLog, updateLog } = useStore()
  const settings = db.settings
  const today = todayISO()
  const [quickWeight, setQuickWeight] = useState<string>('')

  const entries = useMemo(() => weightEntriesFromLogs(db.dailyLogs), [db.dailyLogs])
  const ma = useMemo(() => calculateSevenDayMovingAverage(entries), [entries])
  const trend = useMemo(() => calculateWeightTrend(entries, settings), [entries, settings])

  const totalToLose = round1(settings.startWeightKg - settings.targetWeightKg)
  const progressPct =
    totalToLose > 0 && trend.totalLost != null
      ? (trend.totalLost / totalToLose) * 100
      : 0

  const logToday = () => {
    const v = Number(quickWeight)
    if (!quickWeight || Number.isNaN(v) || v <= 0) return
    updateLog(today, { weightKg: v })
    setQuickWeight('')
  }
  const todayWeight = getLog(today).weightKg

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Weight" subtitle={`Target ${settings.targetWeightKg} kg by ${formatShort(settings.targetDate)}`} />

      {/* Status banner */}
      <div
        className={`card border-l-4 ${
          trend.statusColor === 'good'
            ? 'border-l-good'
            : trend.statusColor === 'warn'
              ? 'border-l-warn'
              : 'border-l-bad'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="field-label">Status</p>
            <p
              className={`text-xl font-bold ${
                trend.statusColor === 'good'
                  ? 'text-good'
                  : trend.statusColor === 'warn'
                    ? 'text-warn'
                    : 'text-bad'
              }`}
            >
              {trend.statusLabel}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-extrabold">{trend.currentAvg ?? '—'}</p>
            <p className="text-xs text-zinc-400">7-day avg kg</p>
          </div>
        </div>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs text-zinc-400">
            <span>{settings.startWeightKg} kg</span>
            <span>{Math.round(Math.max(0, Math.min(100, progressPct)))}% there</span>
            <span>{settings.targetWeightKg} kg</span>
          </div>
          <ProgressBar value={progressPct} tone={trend.statusColor === 'bad' ? 'bad' : trend.statusColor === 'warn' ? 'warn' : 'good'} />
        </div>
      </div>

      {/* Quick log */}
      <div className="card">
        <label className="field-label mb-2 block">
          {todayWeight != null ? `Today logged: ${todayWeight} kg — update?` : "Log today's weight"}
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={quickWeight}
            placeholder={String(trend.currentWeight ?? settings.startWeightKg)}
            onChange={(e) => setQuickWeight(e.target.value)}
            className="input text-center text-xl font-bold"
          />
          <button onClick={logToday} className="btn-primary px-6">Save</button>
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <h2 className="mb-2 text-sm font-semibold text-zinc-300">Trend (7-day average)</h2>
        <WeightChart data={ma} target={settings.targetWeightKg} />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total lost" value={`${trend.totalLost ?? 0} kg`} tone={(trend.totalLost ?? 0) > 0 ? 'good' : 'neutral'} />
        <StatCard label="Remaining" value={`${trend.remaining ?? totalToLose} kg`} tone={(trend.remaining ?? 1) <= 0 ? 'good' : 'warn'} />
        <StatCard label="Avg weekly change" value={`${trend.avgWeeklyChange ?? 0} kg`} tone={(trend.avgWeeklyChange ?? 0) < 0 ? 'good' : 'warn'} />
        <StatCard label="Need / week" value={`${trend.requiredWeeklyLoss ?? 0} kg`} sub="to hit target" />
        <StatCard label="Best" value={`${trend.best ?? '—'} kg`} tone="good" />
        <StatCard label="Worst" value={`${trend.worst ?? '—'} kg`} tone="warn" />
        <StatCard label="Entries logged" value={trend.entries} />
        <StatCard label="Days remaining" value={trend.daysRemaining} sub="until target date" />
      </div>

      {/* Projection */}
      <div className="card">
        <p className="field-label">Projected at current rate</p>
        <p className="mt-1 text-lg font-bold">
          {trend.projectedDate
            ? `Target reached ~${formatShort(trend.projectedDate)}`
            : trend.remaining != null && trend.remaining <= 0
              ? 'Target already reached. Hold it.'
              : 'Not losing fast enough to project a date yet.'}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Based on your recent 7-day average, not single days. One bad day won't move this.
        </p>
      </div>
    </div>
  )
}
