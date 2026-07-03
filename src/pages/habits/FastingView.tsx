import { useMemo, useState } from 'react'
import type { FastingSession } from '../../types'
import { useStore } from '../../storage/StoreContext'
import { useRanges } from '../../hooks/useRanges'
import StatCard from '../../components/StatCard'
import BarChartSimple from '../../components/BarChartSimple'
import Modal from '../../components/Modal'
import SegmentedControl from '../../components/SegmentedControl'
import { IconPlus, IconTrash } from '../../components/icons'
import {
  PROTOCOLS,
  calculateFastingStats,
  endDateOf,
  fastHours,
  fastMs,
  formatClock,
  formatElapsed,
  getActiveFast,
  metGoal,
} from '../../utils/fasting'
import { formatShort, lastNDays } from '../../utils/date'

const p2 = (n: number) => String(n).padStart(2, '0')
function toLocalInput(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`
}
const fromLocalInput = (v: string): number => new Date(v).getTime()

interface Draft {
  id: string | null
  start: string
  end: string
}

export default function FastingView() {
  const { db, updateSettings, addFast, updateFast, deleteFast } = useStore()
  const ranges = useRanges()
  const goal = db.settings.fastingGoalHours

  const stats = useMemo(
    () => calculateFastingStats(db.fastingSessions, ranges.week, ranges.all),
    [db.fastingSessions, ranges],
  )

  const active = getActiveFast(db.fastingSessions)
  const history = useMemo(
    () =>
      [...db.fastingSessions]
        .filter((s) => s.endAt != null)
        .sort((a, b) => (b.startAt) - (a.startAt)),
    [db.fastingSessions],
  )

  // 14-day chart: longest fast (hours) ending each day
  const chart = useMemo(
    () =>
      lastNDays(14).map((d) => {
        const hrs = db.fastingSessions
          .filter((s) => s.endAt != null && endDateOf(s) === d)
          .map((s) => fastHours(s))
        return { date: d, value: hrs.length ? Math.round(Math.max(...hrs) * 10) / 10 : 0 }
      }),
    [db.fastingSessions],
  )

  const [draft, setDraft] = useState<Draft | null>(null)
  const openAdd = () => {
    const now = Date.now()
    setDraft({ id: null, start: toLocalInput(now - goal * 3_600_000), end: toLocalInput(now) })
  }
  const openEdit = (s: FastingSession) =>
    setDraft({ id: s.id, start: toLocalInput(s.startAt), end: toLocalInput(s.endAt as number) })

  const startTs = draft ? fromLocalInput(draft.start) : NaN
  const endTs = draft ? fromLocalInput(draft.end) : NaN
  const draftValid =
    draft != null &&
    Number.isFinite(startTs) &&
    Number.isFinite(endTs) &&
    endTs > startTs &&
    endTs <= Date.now() + 60_000 &&
    endTs - startTs <= 7 * 86_400_000

  const saveDraft = () => {
    if (!draft || !draftValid) return
    if (draft.id) {
      updateFast(draft.id, { startAt: startTs, endAt: endTs })
    } else {
      addFast({ id: `fast-${Date.now()}`, startAt: startTs, endAt: endTs, goalHours: goal, notes: '' })
    }
    setDraft(null)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Protocol */}
      <div className="card">
        <p className="field-label mb-2">Protocol (fasting window)</p>
        <SegmentedControl
          value={goal}
          onChange={(h) => updateSettings({ fastingGoalHours: h })}
          options={PROTOCOLS.map((pr) => ({ label: pr.label, value: pr.hours }))}
        />
      </div>

      {active && (
        <div className="rounded-xl border border-accent/40 bg-accent/10 p-3 text-sm text-accent">
          A fast is running ({formatElapsed(fastMs(active))}). Manage it on the Today screen.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Streak" value={stats.currentStreak} sub="days" tone={stats.currentStreak > 0 ? 'good' : 'neutral'} />
        <StatCard label="Best streak" value={stats.bestStreak} sub="days" />
        <StatCard label="Goal hit" value={`${stats.goalHitRate}%`} tone={stats.goalHitRate >= 70 ? 'good' : 'warn'} />
        <StatCard label="Longest" value={`${stats.longestHours}h`} tone="good" />
        <StatCard label="Average" value={stats.avgHours != null ? `${stats.avgHours}h` : '—'} />
        <StatCard label="This week" value={stats.thisWeek} sub={`${stats.totalCompleted} total`} />
      </div>

      {/* Chart */}
      <div className="card">
        <h3 className="mb-2 text-sm font-semibold text-zinc-300">Last 14 days</h3>
        <BarChartSimple
          data={chart}
          unit="h"
          colorFor={(d) => (d.value >= goal ? '#22c55e' : d.value > 0 ? '#3b82f6' : '#3f3f46')}
          emptyMessage="No completed fasts yet. Start one on Today."
        />
        <p className="mt-2 text-xs text-zinc-500">Green bars hit your {goal}h goal.</p>
      </div>

      <button onClick={openAdd} className="btn-ghost flex items-center justify-center gap-2">
        <IconPlus width={18} height={18} /> Add past fast
      </button>

      {/* History */}
      <div className="flex flex-col gap-2">
        {history.length === 0 && (
          <p className="card text-center text-sm text-zinc-500">No completed fasts yet.</p>
        )}
        {history.map((s) => {
          const hit = metGoal(s)
          return (
            <div key={s.id} className="card flex items-center justify-between">
              <button onClick={() => openEdit(s)} className="flex-1 text-left">
                <p className="font-semibold">
                  {formatElapsed(fastMs(s))}{' '}
                  <span className={hit ? 'text-good' : 'text-zinc-500'}>{hit ? '✓' : ''}</span>
                </p>
                <p className="text-xs text-zinc-400">
                  {formatShort(endDateOf(s) as string)} · {formatClock(s.startAt)} → {formatClock(s.endAt as number)}
                </p>
              </button>
              <button onClick={() => deleteFast(s.id)} className="text-zinc-500 hover:text-bad" aria-label="Delete">
                <IconTrash width={18} height={18} />
              </button>
            </div>
          )
        })}
      </div>

      <Modal
        open={draft != null}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Edit fast' : 'Add past fast'}
        footer={
          <div className="flex gap-2">
            <button onClick={() => setDraft(null)} className="btn-ghost flex-1">Cancel</button>
            <button onClick={saveDraft} disabled={!draftValid} className="btn-primary flex-1 disabled:opacity-40">
              Save
            </button>
          </div>
        }
      >
        {draft && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="field-label mb-2 block">Started</label>
              <input
                type="datetime-local"
                value={draft.start}
                max={toLocalInput(Date.now())}
                onChange={(e) => setDraft({ ...draft, start: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="field-label mb-2 block">Ended</label>
              <input
                type="datetime-local"
                value={draft.end}
                max={toLocalInput(Date.now())}
                onChange={(e) => setDraft({ ...draft, end: e.target.value })}
                className="input"
              />
            </div>
            <div className="rounded-xl bg-base-800 p-3 text-sm">
              {draftValid ? (
                <span className="text-zinc-300">
                  Duration: <strong>{formatElapsed(endTs - startTs)}</strong>{' '}
                  {endTs - startTs >= goal * 3_600_000 ? (
                    <span className="text-good">· hits {goal}h goal</span>
                  ) : (
                    <span className="text-warn">· below {goal}h goal</span>
                  )}
                </span>
              ) : (
                <span className="text-bad">End must be after start, not in the future, under 7 days.</span>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
