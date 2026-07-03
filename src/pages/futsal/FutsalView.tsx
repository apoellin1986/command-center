import { useMemo, useState } from 'react'
import type { FutsalSession, Intensity } from '../../types'
import { useStore } from '../../storage/StoreContext'
import { useRanges } from '../../hooks/useRanges'
import StatCard from '../../components/StatCard'
import Modal from '../../components/Modal'
import SegmentedControl from '../../components/SegmentedControl'
import { IconPlus, IconTrash } from '../../components/icons'
import { calculateFutsalStats } from '../../utils/calculations'
import { formatShort, isValidISODate, todayISO } from '../../utils/date'

const intensities: Intensity[] = ['Low', 'Medium', 'High']

function blankForm(): Omit<FutsalSession, 'id'> {
  return {
    date: todayISO(),
    durationMin: 60,
    intensity: 'Medium',
    performance: 7,
    hydration: 3,
    energyBefore: 3,
    notes: '',
  }
}

export default function FutsalView() {
  const { db, addFutsal, deleteFutsal, updateLog, getLog } = useStore()
  const ranges = useRanges()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(blankForm())

  const stats = useMemo(
    () => calculateFutsalStats(db.futsalSessions, ranges.week, ranges.month),
    [db.futsalSessions, ranges],
  )
  const sessions = useMemo(
    () => [...db.futsalSessions].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [db.futsalSessions],
  )

  // A cleared or future date must never be persisted — an invalid date used
  // to crash list rendering permanently.
  const dateInvalid = !isValidISODate(form.date) || form.date > todayISO()

  const save = () => {
    if (dateInvalid) return
    addFutsal({ ...form, id: `futsal-${Date.now()}` })
    // keep the daily log in sync
    const log = getLog(form.date)
    if (!log.futsalPlayed) updateLog(form.date, { futsalPlayed: true })
    setForm(blankForm())
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="This week" value={stats.thisWeek} sub={`target ${db.settings.weeklyFutsalTarget}`} tone={stats.thisWeek >= db.settings.weeklyFutsalTarget ? 'good' : 'warn'} />
        <StatCard label="This month" value={stats.thisMonth} />
        <StatCard label="Days since last" value={stats.daysSinceLast ?? '—'} tone={(stats.daysSinceLast ?? 0) > 7 ? 'warn' : 'neutral'} />
        <StatCard label="Avg performance" value={stats.avgPerformance ?? '—'} sub="out of 10" />
      </div>

      {stats.recoveryWarning && (
        <div className="rounded-xl border border-warn/40 bg-warn/10 p-3 text-sm text-warn">
          You played futsal {stats.thisWeek}× this week. Prioritize recovery — sleep and hydration.
        </div>
      )}
      {stats.avgHydration != null && stats.avgHydration < 3 && (
        <div className="rounded-xl border border-bad/40 bg-bad/10 p-3 text-sm text-bad">
          Hydration looks poor on game days (avg {stats.avgHydration}/5). Fix it before high-intensity sessions.
        </div>
      )}

      <button onClick={() => setOpen(true)} className="btn-primary flex items-center justify-center gap-2">
        <IconPlus width={18} height={18} /> Log futsal session
      </button>

      <div className="flex flex-col gap-2">
        {sessions.length === 0 && (
          <p className="card text-center text-sm text-zinc-500">No futsal sessions yet. Log your first game.</p>
        )}
        {sessions.map((s) => (
          <div key={s.id} className="card flex items-center justify-between">
            <div>
              <p className="font-semibold">{formatShort(s.date)} · {s.durationMin} min</p>
              <p className="text-xs text-zinc-400">
                {s.intensity} · Perf {s.performance}/10 · Hydration {s.hydration}/5
              </p>
              {s.notes && <p className="mt-1 text-xs text-zinc-500">{s.notes}</p>}
            </div>
            <button onClick={() => deleteFutsal(s.id)} className="text-zinc-500 hover:text-bad" aria-label="Delete">
              <IconTrash width={18} height={18} />
            </button>
          </div>
        ))}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Log futsal session"
        footer={
          <div className="flex gap-2">
            <button onClick={() => setOpen(false)} className="btn-ghost flex-1">Cancel</button>
            <button onClick={save} disabled={dateInvalid} className="btn-primary flex-1 disabled:opacity-40">Save session</button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="field-label mb-2 block">Date</label>
            <input type="date" value={form.date} max={todayISO()} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" />
            {dateInvalid && <p className="mt-1 text-xs text-bad">Pick a valid date — today or earlier.</p>}
          </div>
          <div>
            <label className="field-label mb-2 block">Duration: {form.durationMin} min</label>
            <input type="range" min={20} max={120} step={5} value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })} className="w-full accent-accent" />
          </div>
          <div>
            <label className="field-label mb-2 block">Intensity</label>
            <SegmentedControl value={form.intensity} onChange={(v) => setForm({ ...form, intensity: v })} options={intensities.map((i) => ({ label: i, value: i }))} />
          </div>
          <SliderRow label="Performance" value={form.performance} max={10} onChange={(v) => setForm({ ...form, performance: v })} />
          <SliderRow label="Hydration quality" value={form.hydration} max={5} onChange={(v) => setForm({ ...form, hydration: v })} />
          <SliderRow label="Energy before game" value={form.energyBefore} max={5} onChange={(v) => setForm({ ...form, energyBefore: v })} />
          <div>
            <label className="field-label mb-2 block">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="input resize-none" placeholder="How did you play?" />
          </div>
        </div>
      </Modal>
    </div>
  )
}

function SliderRow({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="field-label mb-2 block">{label}: {value}/{max}</label>
      <input type="range" min={1} max={max} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-accent" />
    </div>
  )
}
