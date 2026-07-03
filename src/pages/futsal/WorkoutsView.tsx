import { useMemo, useState } from 'react'
import type { ExerciseEntry, Intensity, WorkoutSession, WorkoutType } from '../../types'
import { useStore } from '../../storage/StoreContext'
import { useRanges } from '../../hooks/useRanges'
import StatCard from '../../components/StatCard'
import Modal from '../../components/Modal'
import SegmentedControl from '../../components/SegmentedControl'
import { IconPlus, IconTrash } from '../../components/icons'
import { formatShort, isValidISODate, todayISO } from '../../utils/date'

const types: WorkoutType[] = ['Push', 'Pull', 'Legs', 'Full Body', 'Core', 'Treadmill/Cardio', 'Recovery/Mobility']
const intensities: Intensity[] = ['Low', 'Medium', 'High']

function blankForm(): Omit<WorkoutSession, 'id'> {
  return { date: todayISO(), type: 'Full Body', durationMin: 30, intensity: 'Medium', completed: true, notes: '', exercises: [] }
}

export default function WorkoutsView() {
  const { db, addWorkout, deleteWorkout, updateLog, getLog } = useStore()
  const ranges = useRanges()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(blankForm())

  const sessions = useMemo(
    () => [...db.workoutSessions].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [db.workoutSessions],
  )
  const weekCount = sessions.filter((s) => ranges.week.includes(s.date) && s.completed).length
  const monthCount = sessions.filter((s) => ranges.month.includes(s.date) && s.completed).length

  const addExercise = () =>
    setForm((f) => ({
      ...f,
      exercises: [...f.exercises, { id: `ex-${Date.now()}`, name: '', sets: null, reps: null, weightKg: null, notes: '' }],
    }))
  const updateExercise = (id: string, patch: Partial<ExerciseEntry>) =>
    setForm((f) => ({ ...f, exercises: f.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)) }))
  const removeExercise = (id: string) =>
    setForm((f) => ({ ...f, exercises: f.exercises.filter((e) => e.id !== id) }))

  // A cleared or future date must never be persisted — an invalid date used
  // to crash list rendering permanently.
  const dateInvalid = !isValidISODate(form.date) || form.date > todayISO()

  const save = () => {
    if (dateInvalid) return
    addWorkout({ ...form, id: `workout-${Date.now()}`, exercises: form.exercises.filter((e) => e.name.trim()) })
    if (form.completed) {
      const log = getLog(form.date)
      if (!log.homeWorkout) updateLog(form.date, { homeWorkout: true })
    }
    setForm(blankForm())
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="This week" value={weekCount} sub={`target ${db.settings.weeklyWorkoutTarget}`} tone={weekCount >= db.settings.weeklyWorkoutTarget ? 'good' : 'warn'} />
        <StatCard label="This month" value={monthCount} />
      </div>

      <button onClick={() => setOpen(true)} className="btn-primary flex items-center justify-center gap-2">
        <IconPlus width={18} height={18} /> Log workout
      </button>

      <div className="flex flex-col gap-2">
        {sessions.length === 0 && (
          <p className="card text-center text-sm text-zinc-500">No workouts logged yet. Optional — but it counts.</p>
        )}
        {sessions.map((s) => (
          <div key={s.id} className="card flex items-center justify-between">
            <div>
              <p className="font-semibold">
                {s.type} · {s.durationMin} min {!s.completed && <span className="text-xs text-warn">(skipped)</span>}
              </p>
              <p className="text-xs text-zinc-400">{formatShort(s.date)} · {s.intensity}{s.exercises.length ? ` · ${s.exercises.length} exercises` : ''}</p>
              {s.notes && <p className="mt-1 text-xs text-zinc-500">{s.notes}</p>}
            </div>
            <button onClick={() => deleteWorkout(s.id)} className="text-zinc-500 hover:text-bad" aria-label="Delete">
              <IconTrash width={18} height={18} />
            </button>
          </div>
        ))}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Log workout"
        footer={
          <div className="flex gap-2">
            <button onClick={() => setOpen(false)} className="btn-ghost flex-1">Cancel</button>
            <button onClick={save} disabled={dateInvalid} className="btn-primary flex-1 disabled:opacity-40">Save workout</button>
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
            <label className="field-label mb-2 block">Type</label>
            <div className="flex flex-wrap gap-2">
              {types.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  className={`pill ${form.type === t ? 'bg-accent text-white' : 'bg-base-700 text-zinc-300'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="field-label mb-2 block">Duration: {form.durationMin} min</label>
            <input type="range" min={10} max={120} step={5} value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })} className="w-full accent-accent" />
          </div>
          <div>
            <label className="field-label mb-2 block">Intensity</label>
            <SegmentedControl value={form.intensity} onChange={(v) => setForm({ ...form, intensity: v })} options={intensities.map((i) => ({ label: i, value: i }))} />
          </div>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={form.completed} onChange={(e) => setForm({ ...form, completed: e.target.checked })} className="h-5 w-5 accent-accent" />
            <span className="text-sm">Completed</span>
          </label>

          {/* Optional exercise logging */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="field-label">Exercises (optional)</label>
              <button onClick={addExercise} className="pill bg-base-700 text-zinc-300"><IconPlus width={14} height={14} /> Add</button>
            </div>
            <div className="flex flex-col gap-3">
              {form.exercises.map((ex) => (
                <div key={ex.id} className="rounded-xl border border-base-600 bg-base-900 p-3">
                  <div className="mb-2 flex gap-2">
                    <input value={ex.name} onChange={(e) => updateExercise(ex.id, { name: e.target.value })} placeholder="Exercise" className="input flex-1" />
                    <button onClick={() => removeExercise(ex.id)} className="text-zinc-500 hover:text-bad"><IconTrash width={16} height={16} /></button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" inputMode="numeric" value={ex.sets ?? ''} onChange={(e) => updateExercise(ex.id, { sets: e.target.value === '' ? null : Number(e.target.value) })} placeholder="Sets" className="input text-center" />
                    <input type="number" inputMode="numeric" value={ex.reps ?? ''} onChange={(e) => updateExercise(ex.id, { reps: e.target.value === '' ? null : Number(e.target.value) })} placeholder="Reps" className="input text-center" />
                    <input type="number" inputMode="decimal" value={ex.weightKg ?? ''} onChange={(e) => updateExercise(ex.id, { weightKg: e.target.value === '' ? null : Number(e.target.value) })} placeholder="kg" className="input text-center" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="field-label mb-2 block">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="input resize-none" />
          </div>
        </div>
      </Modal>
    </div>
  )
}
