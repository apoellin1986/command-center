import { useEffect, useState } from 'react'
import type { AppDatabase, CustomSupplement, GoalSettings, RequiredField } from '../types'
import { useStore } from '../storage/StoreContext'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import { IconPlus, IconTrash } from '../components/icons'
import {
  exportDailyCSV,
  exportWeightCSV,
  parseImportedJSON,
  pickFile,
} from '../utils/exportImport'
import { useBackup } from '../hooks/useBackup'
import { age } from '../utils/calculations'

const requiredOptions: { value: RequiredField; label: string }[] = [
  { value: 'creatine', label: 'Creatine' },
  { value: 'omega3', label: 'Omega 3' },
  { value: 'pushups', label: 'Push-ups' },
  { value: 'waterTarget', label: 'Water target' },
  { value: 'training', label: 'Training (futsal/workout)' },
]

interface NumFieldProps {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
  suffix?: string
  min?: number
}

/** Numeric setting with a local draft: commits (clamped) on blur so
 * half-typed or garbage values never get persisted. */
function NumField({ label, value, onChange, step = 1, suffix, min = 0 }: NumFieldProps) {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])

  const commit = () => {
    const v = Number(draft)
    if (draft.trim() === '' || !Number.isFinite(v)) {
      setDraft(String(value)) // revert — never persist garbage
      return
    }
    const clamped = Math.max(min, v)
    setDraft(String(clamped))
    onChange(clamped)
  }

  return (
    <div>
      <label className="field-label mb-1.5 block">{label}{suffix ? ` (${suffix})` : ''}</label>
      <input
        type="number"
        inputMode="decimal"
        value={draft}
        step={step}
        min={min}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        className="input"
      />
    </div>
  )
}

export default function SettingsPage() {
  const { db, updateSettings, resetAll, importDatabase, onboardDemo } = useStore()
  const { status: backup, busy: backupBusy, backupNow } = useBackup()
  const s = db.settings
  const set = (patch: Partial<GoalSettings>) => updateSettings(patch)

  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmDemo, setConfirmDemo] = useState(false)
  const [pendingImport, setPendingImport] = useState<AppDatabase | null>(null)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [newSupp, setNewSupp] = useState('')

  const toggleRequired = (f: RequiredField) => {
    const has = s.requiredFields.includes(f)
    set({ requiredFields: has ? s.requiredFields.filter((x) => x !== f) : [...s.requiredFields, f] })
  }

  const addSupplement = () => {
    if (!newSupp.trim()) return
    const supp: CustomSupplement = { id: `supp-${Date.now()}`, name: newSupp.trim(), enabled: true }
    set({ customSupplements: [...s.customSupplements, supp] })
    setNewSupp('')
  }
  const updateSupp = (id: string, patch: Partial<CustomSupplement>) =>
    set({ customSupplements: s.customSupplements.map((x) => (x.id === id ? { ...x, ...patch } : x)) })
  const removeSupp = (id: string) =>
    set({ customSupplements: s.customSupplements.filter((x) => x.id !== id) })

  // Import is two-step: pick + validate, then an explicit confirmation that
  // spells out what gets replaced. No more one-tap total data loss.
  const doImport = () => {
    setImportMsg(null)
    pickFile((text) => {
      if (text == null) {
        setImportMsg('Could not read the selected file.')
        return
      }
      const res = parseImportedJSON(text)
      if (res.ok && res.db) {
        setPendingImport(res.db)
      } else {
        setImportMsg(res.error ?? 'Import failed.')
      }
    })
  }

  const confirmImport = () => {
    if (!pendingImport) return
    importDatabase(pendingImport)
    setPendingImport(null)
    setImportMsg('Import successful. Your data has been replaced.')
  }

  const currentDays = Object.keys(db.dailyLogs).length
  const importDays = pendingImport ? Object.keys(pendingImport.dailyLogs).length : 0

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Settings" subtitle="Goals, supplements & your data" />

      {/* Goals */}
      <section className="card flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Weight goal</h2>
        <div className="grid grid-cols-2 gap-3">
          <NumField label="Start weight" suffix="kg" step={0.1} min={1} value={s.startWeightKg} onChange={(v) => set({ startWeightKg: v })} />
          <NumField label="Target weight" suffix="kg" step={0.1} min={1} value={s.targetWeightKg} onChange={(v) => set({ targetWeightKg: v })} />
        </div>
        <div>
          <label className="field-label mb-1.5 block">Target date</label>
          <input
            type="date"
            value={s.targetDate}
            onChange={(e) => e.target.value && set({ targetDate: e.target.value })}
            className="input"
          />
        </div>
        <div>
          <label className="field-label mb-1.5 block">Birth date — you are {age(s.birthDate)}</label>
          <input
            type="date"
            value={s.birthDate}
            onChange={(e) => e.target.value && set({ birthDate: e.target.value })}
            className="input"
          />
        </div>
      </section>

      {/* Targets */}
      <section className="card flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Training targets</h2>
        <div className="grid grid-cols-2 gap-3">
          <NumField label="Daily push-ups" min={1} value={s.dailyPushupTarget} onChange={(v) => set({ dailyPushupTarget: v })} />
          <NumField label="Monthly push-ups" value={s.monthlyPushupTarget} onChange={(v) => set({ monthlyPushupTarget: v })} />
          <NumField label="Weekly futsal" value={s.weeklyFutsalTarget} onChange={(v) => set({ weeklyFutsalTarget: v })} />
          <NumField label="Weekly workouts" value={s.weeklyWorkoutTarget} onChange={(v) => set({ weeklyWorkoutTarget: v })} />
          <NumField label="Protein / week" value={s.weeklyProteinTarget} onChange={(v) => set({ weeklyProteinTarget: v })} />
          <NumField label="Weigh-ins / week" value={s.weeklyWeightTarget} onChange={(v) => set({ weeklyWeightTarget: v })} />
        </div>
        <div>
          <label className="field-label mb-1.5 block">Water goal</label>
          <input value={s.waterGoalDescription} onChange={(e) => set({ waterGoalDescription: e.target.value })} className="input" />
        </div>
      </section>

      {/* Required fields */}
      <section className="card flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Required for a complete day</h2>
        <div className="flex flex-wrap gap-2">
          {requiredOptions.map((o) => {
            const active = s.requiredFields.includes(o.value)
            return (
              <button key={o.value} onClick={() => toggleRequired(o.value)} className={`pill ${active ? 'bg-accent text-white' : 'bg-base-700 text-zinc-400'}`}>
                {active ? '✓ ' : ''}{o.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* Supplements */}
      <section className="card flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Custom supplements</h2>
        {s.customSupplements.map((supp) => (
          <div key={supp.id} className="flex items-center gap-2">
            <button onClick={() => updateSupp(supp.id, { enabled: !supp.enabled })} className={`pill ${supp.enabled ? 'bg-good/20 text-good' : 'bg-base-700 text-zinc-500'}`}>
              {supp.enabled ? 'ON' : 'OFF'}
            </button>
            <span className="flex-1 text-sm">{supp.name}</span>
            <button onClick={() => removeSupp(supp.id)} className="text-zinc-500 hover:text-bad"><IconTrash width={16} height={16} /></button>
          </div>
        ))}
        <div className="flex gap-2">
          <input value={newSupp} onChange={(e) => setNewSupp(e.target.value)} placeholder="e.g. Magnesium" className="input flex-1" onKeyDown={(e) => e.key === 'Enter' && addSupplement()} />
          <button onClick={addSupplement} className="btn-ghost px-4"><IconPlus width={18} height={18} /></button>
        </div>
      </section>

      {/* Data management */}
      <section className="card flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Data</h2>

        {/* Backup status */}
        <div className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${
          backup.tone === 'good'
            ? 'border-good/40 bg-good/10'
            : backup.tone === 'warn'
              ? 'border-warn/40 bg-warn/10'
              : 'border-bad/40 bg-bad/10'
        }`}>
          <div>
            <p className="field-label">Last backup</p>
            <p className={`text-sm font-semibold ${
              backup.tone === 'good' ? 'text-good' : backup.tone === 'warn' ? 'text-warn' : 'text-bad'
            }`}>
              {backup.label}
            </p>
          </div>
          {backup.overdue && backup.hasData && (
            <span className="pill bg-base-700 text-zinc-300">Back up soon</span>
          )}
        </div>

        <button
          onClick={() => void backupNow()}
          disabled={backupBusy}
          className="btn-primary disabled:opacity-50"
        >
          {backupBusy ? 'Saving…' : 'Export all data (JSON backup)'}
        </button>
        <button onClick={doImport} className="btn-ghost">Import data from JSON</button>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => exportWeightCSV(db)} className="btn-ghost">Weight CSV</button>
          <button onClick={() => exportDailyCSV(db)} className="btn-ghost">Check-ins CSV</button>
        </div>
        {db.meta.isDemo && (
          <button onClick={() => setConfirmDemo(true)} className="btn-ghost">Regenerate demo data</button>
        )}
        <button onClick={() => setConfirmReset(true)} className="btn-danger">Reset all data</button>
        {importMsg && <p className="text-center text-xs text-zinc-400">{importMsg}</p>}
        <p className="text-center text-xs text-zinc-500">
          Everything is stored only on this device. Export regularly — clearing browser data wipes it.
        </p>
      </section>

      {/* Import confirmation */}
      <Modal
        open={pendingImport != null}
        onClose={() => setPendingImport(null)}
        title="Replace all data?"
        footer={
          <div className="flex gap-2">
            <button onClick={() => setPendingImport(null)} className="btn-ghost flex-1">Cancel</button>
            <button onClick={confirmImport} className="btn-danger flex-1">Replace my data</button>
          </div>
        }
      >
        <div className="flex flex-col gap-3 text-sm text-zinc-300">
          <p>
            The selected file contains <strong>{importDays} logged days</strong>,{' '}
            {pendingImport?.futsalSessions.length ?? 0} futsal sessions and{' '}
            {pendingImport?.workoutSessions.length ?? 0} workouts.
          </p>
          <p className="text-warn">
            Importing replaces everything currently on this device
            ({currentDays} logged days). This cannot be undone.
          </p>
        </div>
      </Modal>

      {/* Demo regeneration confirmation */}
      <Modal
        open={confirmDemo}
        onClose={() => setConfirmDemo(false)}
        title="Regenerate demo data?"
        footer={
          <div className="flex gap-2">
            <button onClick={() => setConfirmDemo(false)} className="btn-ghost flex-1">Cancel</button>
            <button
              onClick={() => { onboardDemo(); setConfirmDemo(false) }}
              className="btn-danger flex-1"
            >
              Yes, replace with demo
            </button>
          </div>
        }
      >
        <p className="text-sm text-zinc-300">
          This replaces <strong>everything</strong> currently stored — including any real
          check-ins you've logged on top of the demo — with fresh random demo data.
          Export a backup first if anything here is real.
        </p>
      </Modal>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset all data?"
        footer={
          <div className="flex gap-2">
            <button onClick={() => setConfirmReset(false)} className="btn-ghost flex-1">Cancel</button>
            <button
              onClick={() => { resetAll(); setConfirmReset(false) }}
              className="btn-danger flex-1"
            >
              Yes, delete everything
            </button>
          </div>
        }
      >
        <p className="text-sm text-zinc-300">
          This permanently deletes every check-in, weight entry, futsal and workout session on this device.
          This cannot be undone. Export a backup first if you're unsure.
        </p>
      </Modal>
    </div>
  )
}
