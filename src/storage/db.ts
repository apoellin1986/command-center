import type {
  AppDatabase,
  DailyLog,
  GoalSettings,
  ISODate,
  RequiredField,
} from '../types'
import { todayISO } from '../utils/date'

const STORAGE_KEY = 'command-center-db'
export const DB_VERSION = 2

const DEFAULT_REQUIRED: RequiredField[] = [
  'creatine',
  'omega3',
  'pushups',
  'waterTarget',
  'training',
]

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export function defaultSettings(): GoalSettings {
  return {
    weightUnit: 'kg',
    startWeightKg: 90,
    targetWeightKg: 80,
    targetDate: '2026-07-15', // 40th birthday — the deadline
    startDate: todayISO(),
    dailyPushupTarget: 50,
    monthlyPushupTarget: 1500,
    weeklyFutsalTarget: 2,
    weeklyWorkoutTarget: 2,
    weeklyProteinTarget: 2,
    weeklyWeightTarget: 1,
    waterGoalDescription: '2.5L / day',
    customSupplements: [],
    requiredFields: [...DEFAULT_REQUIRED],
    birthDate: '1986-07-15',
  }
}

export function blankDailyLog(date: ISODate): DailyLog {
  return {
    date,
    weightKg: null,
    creatine: false,
    omega3: false,
    protein: false,
    pushups: null,
    futsalPlayed: false,
    homeWorkout: false,
    cardio: false,
    waterTarget: false,
    sweetsAvoided: false,
    notes: '',
    customSupplements: {},
    updatedAt: Date.now(),
  }
}

export function emptyDatabase(): AppDatabase {
  return {
    version: DB_VERSION,
    settings: defaultSettings(),
    dailyLogs: {},
    futsalSessions: [],
    workoutSessions: [],
    meta: {
      createdAt: Date.now(),
      onboarded: false,
      isDemo: false,
    },
  }
}

// ---------------------------------------------------------------------------
// Persistence (localStorage). Defensive against bad / partial data.
// ---------------------------------------------------------------------------

export function loadDatabase(): AppDatabase | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return migrate(parsed)
  } catch (err) {
    console.error('Failed to load database, starting fresh.', err)
    return null
  }
}

export function saveDatabase(db: AppDatabase): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch (err) {
    console.error('Failed to save database.', err)
  }
}

export function clearDatabase(): void {
  localStorage.removeItem(STORAGE_KEY)
}

const VALID_REQUIRED: RequiredField[] = [
  'creatine', 'omega3', 'pushups', 'waterTarget', 'training',
]

/** Merge an unknown object onto a known-good shape so old / partial
 * exports never crash the app. Also runs v1 -> v2 model migration
 * (drops vitamins/sleep, adds omega3/protein + weekly targets) while
 * preserving all real history like the creatine streak. */
export function migrate(input: unknown): AppDatabase {
  const base = emptyDatabase()
  if (!input || typeof input !== 'object') return base
  const data = input as Partial<AppDatabase> & { version?: number }
  const incomingVersion = typeof data.version === 'number' ? data.version : 1

  // Settings: keep stored values, but for pre-v2 data force the new
  // completion model (old requiredFields referenced removed habits).
  const storedSettings = (data.settings ?? {}) as Partial<GoalSettings>
  const settings: GoalSettings = {
    ...base.settings,
    ...storedSettings,
    weeklyProteinTarget: storedSettings.weeklyProteinTarget ?? base.settings.weeklyProteinTarget,
    weeklyWeightTarget: storedSettings.weeklyWeightTarget ?? base.settings.weeklyWeightTarget,
    // Drop the old built-in "Protein shake"/"Vitamin D" supplements —
    // omega 3 and protein are now first-class fields.
    customSupplements: (storedSettings.customSupplements ?? []).filter(
      (s) => s.id !== 'protein' && s.id !== 'vitd',
    ),
    requiredFields:
      incomingVersion < 2 || !Array.isArray(storedSettings.requiredFields)
        ? [...DEFAULT_REQUIRED]
        : storedSettings.requiredFields.filter((f) => VALID_REQUIRED.includes(f)),
  }

  const dailyLogs: Record<ISODate, DailyLog> = {}
  if (data.dailyLogs && typeof data.dailyLogs === 'object') {
    for (const [date, log] of Object.entries(data.dailyLogs)) {
      if (!log || typeof log !== 'object') continue
      // blankDailyLog fills omega3/protein defaults; stored creatine/pushups/
      // water/etc. are preserved. Removed fields (vitamins/sleep) are ignored.
      dailyLogs[date] = { ...blankDailyLog(date), ...(log as DailyLog), date }
    }
  }

  return {
    version: DB_VERSION,
    settings,
    dailyLogs,
    futsalSessions: Array.isArray(data.futsalSessions) ? data.futsalSessions : [],
    workoutSessions: Array.isArray(data.workoutSessions) ? data.workoutSessions : [],
    meta: { ...base.meta, ...(data.meta ?? {}) },
  }
}

export { STORAGE_KEY }
