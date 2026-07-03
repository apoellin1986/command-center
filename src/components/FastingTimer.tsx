import { useMemo } from 'react'
import { useStore } from '../storage/StoreContext'
import { useNow } from '../hooks/useNow'
import RingProgress from './RingProgress'
import {
  endDateOf,
  fastMs,
  formatClock,
  formatElapsed,
  getActiveFast,
  metGoal,
  protocolLabel,
} from '../utils/fasting'
import { calculateCurrentStreak } from '../utils/calculations'

const HOUR = 3_600_000

export default function FastingTimer() {
  const { db, startFast, endFast } = useStore()
  const active = getActiveFast(db.fastingSessions)
  const now = useNow(!!active) // tick only while a fast runs
  const goal = db.settings.fastingGoalHours

  const streak = useMemo(() => {
    const completed = db.fastingSessions.filter((s) => s.endAt != null)
    const metOnDate = (d: string) => completed.some((s) => endDateOf(s) === d && metGoal(s))
    return calculateCurrentStreak(metOnDate)
  }, [db.fastingSessions])

  if (active) {
    const elapsed = fastMs(active, now)
    const goalMs = active.goalHours * HOUR
    const pct = Math.min(100, (elapsed / goalMs) * 100)
    const reached = elapsed >= goalMs
    const projectedEnd = active.startAt + goalMs

    return (
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Fasting</h2>
          <span className={`pill ${reached ? 'bg-good/20 text-good' : 'bg-accent/20 text-accent'}`}>
            {reached ? 'Goal reached' : `${active.goalHours}h goal`}
          </span>
        </div>
        <div className="flex items-center gap-5">
          <RingProgress
            value={pct}
            color={reached ? '#22c55e' : '#3b82f6'}
            label={formatElapsed(elapsed)}
            sublabel={`of ${active.goalHours}h`}
            size={128}
          />
          <div className="flex-1">
            <p className="font-mono text-2xl font-bold tabular-nums">
              {formatElapsed(elapsed, true)}
            </p>
            <p className="mt-1 text-xs text-zinc-400">Started {formatClock(active.startAt)}</p>
            <p className="text-xs text-zinc-400">
              {reached ? 'Goal hit — break it or push on' : `Goal at ${formatClock(projectedEnd)}`}
            </p>
            <button onClick={endFast} className="btn-ghost mt-3 w-full py-2 text-sm">
              End fast
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Idle — offer to start, show streak + last fast
  const lastFast = [...db.fastingSessions]
    .filter((s) => s.endAt != null)
    .sort((a, b) => (b.endAt ?? 0) - (a.endAt ?? 0))[0]

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Fasting</h2>
        <span className="pill bg-base-700 text-zinc-300">{protocolLabel(db.settings)}</span>
      </div>
      <button onClick={() => startFast(goal)} className="btn-primary w-full py-3.5 text-base">
        Start {goal}h fast
      </button>
      <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
        <span>
          {streak > 0 ? `🔥 ${streak}-day fasting streak` : 'No active streak — start one'}
        </span>
        {lastFast && <span>Last: {formatElapsed(fastMs(lastFast))}</span>}
      </div>
    </div>
  )
}
