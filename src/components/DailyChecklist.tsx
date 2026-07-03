import type { ISODate, RequiredField } from '../types'
import { useStore } from '../storage/StoreContext'
import { isFieldSatisfied } from '../utils/calculations'
import ToggleButton from './ToggleButton'
import NumberStepper from './NumberStepper'
import { IconDrop, IconDumbbell, IconFlame, IconFutsal } from './icons'

const REQUIRED_LABELS: Record<RequiredField, string> = {
  creatine: 'Creatine',
  omega3: 'Omega 3',
  pushups: 'Push-ups',
  waterTarget: 'Water',
  training: 'Training',
}

export default function DailyChecklist({ date }: { date: ISODate }) {
  const { getLog, updateLog, db } = useStore()
  const log = getLog(date)
  const settings = db.settings
  const customSupps = settings.customSupplements.filter((s) => s.enabled)

  return (
    <div className="flex flex-col gap-5">
      {/* Weight — weekly cadence */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="field-label">Body weight (kg)</label>
          <span className="text-xs text-zinc-500">Weekly is enough</span>
        </div>
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          max="400"
          value={log.weightKg ?? ''}
          placeholder="—"
          onChange={(e) => {
            const raw = e.target.value
            if (raw === '') {
              updateLog(date, { weightKg: null })
              return
            }
            const v = Number(raw)
            // reject NaN / negative / absurd values instead of storing them
            if (!Number.isFinite(v) || v < 0 || v > 400) return
            updateLog(date, { weightKg: v === 0 ? null : v })
          }}
          className="input text-center text-2xl font-bold"
        />
      </div>

      {/* Push-ups */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="field-label">Push-ups</label>
          <span className="text-xs text-zinc-500">Target {settings.dailyPushupTarget}</span>
        </div>
        <NumberStepper
          value={log.pushups}
          onChange={(v) => updateLog(date, { pushups: v })}
          step={5}
          quickAdds={[10, 20, 50]}
          suffix="reps"
        />
      </div>

      {/* Supplements */}
      <div className="flex flex-col gap-2">
        <label className="field-label">Supplements</label>
        <ToggleButton
          label="Creatine"
          hint="Daily — non-negotiable"
          value={log.creatine}
          onChange={(v) => updateLog(date, { creatine: v })}
        />
        <ToggleButton
          label="Omega 3"
          hint="Daily"
          value={log.omega3}
          onChange={(v) => updateLog(date, { omega3: v })}
        />
        <ToggleButton
          label="Protein shake"
          hint={`Target ${settings.weeklyProteinTarget}× / week`}
          value={log.protein}
          onChange={(v) => updateLog(date, { protein: v })}
        />
        {customSupps.map((s) => (
          <ToggleButton
            key={s.id}
            label={s.name}
            value={!!log.customSupplements[s.id]}
            onChange={(v) =>
              updateLog(date, {
                customSupplements: { ...log.customSupplements, [s.id]: v },
              })
            }
          />
        ))}
      </div>

      {/* Training — either satisfies the day */}
      <div className="flex flex-col gap-2">
        <label className="field-label">Training — futsal or workout completes the day</label>
        <ToggleButton
          label="Futsal played"
          icon={<IconFutsal width={20} height={20} />}
          value={log.futsalPlayed}
          onChange={(v) => updateLog(date, { futsalPlayed: v })}
        />
        <ToggleButton
          label="Home workout"
          icon={<IconDumbbell width={20} height={20} />}
          value={log.homeWorkout}
          onChange={(v) => updateLog(date, { homeWorkout: v })}
        />
        <ToggleButton
          label="Steps / cardio"
          icon={<IconFlame width={20} height={20} />}
          value={log.cardio}
          onChange={(v) => updateLog(date, { cardio: v })}
        />
      </div>

      {/* Discipline */}
      <div className="flex flex-col gap-2">
        <label className="field-label">Discipline</label>
        <ToggleButton
          label="Water target hit"
          hint={settings.waterGoalDescription}
          icon={<IconDrop width={20} height={20} />}
          value={log.waterTarget}
          strict
          onChange={(v) => updateLog(date, { waterTarget: v })}
        />
        <ToggleButton
          label="Sweets avoided"
          value={log.sweetsAvoided}
          onChange={(v) => updateLog(date, { sweetsAvoided: v })}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="field-label mb-2 block">Notes</label>
        <textarea
          value={log.notes}
          onChange={(e) => updateLog(date, { notes: e.target.value })}
          rows={3}
          placeholder="How did today go? Be honest."
          className="input resize-none"
        />
      </div>
    </div>
  )
}

export function RequiredChecklistStatus({ date }: { date: ISODate }) {
  const { getLog, db } = useStore()
  const log = getLog(date)
  return (
    <div className="flex flex-wrap gap-2">
      {db.settings.requiredFields.map((f) => {
        const ok = isFieldSatisfied(log, f)
        return (
          <span
            key={f}
            className={`pill ${ok ? 'bg-good/20 text-good' : 'bg-base-700 text-zinc-400'}`}
          >
            {ok ? '✓' : '○'} {REQUIRED_LABELS[f]}
          </span>
        )
      })}
    </div>
  )
}
