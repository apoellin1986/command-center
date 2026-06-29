import type {
  AppDatabase,
  DailyLog,
  GoalSettings,
  ISODate,
} from '../types'
import { todayISO } from '../utils/date'

const STORAGE_KEY = 'command-center-db'
export const DB_VERSION = 1

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
    waterGoalDescription: '2.5L / day',
    customSupplements: [
      { id: 'protein', name: 'Protein shake', enabled: true },
      { id: 'vitd', name: 'Vitamin D', enabled: true },
    ],
    requiredFields: ['creatine', 'vitamins', 'pushups', 'waterTarget'],
    birthDate: '1986-07-15',
  }
}

export function blankDailyLog(date: ISODate): DailyLog {
  return {
    date,
    weightKg: null,
    creatine: false,
    vitamins: false,
    pushups: null,
    futsalPlayed: false,
    homeWorkout: false,
    cardio: false,
    waterTarget: false,
    sweetsAvoided: false,
    sleepQuality: null,
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

/** Merge an unknown object onto a known-good shape so old / partial
 * exports never crash the app. */
export function migrate(input: unknown): AppDatabase {
  const base = emptyDatabase()
  if (!input || typeof input !== 'object') return base
  const data = input as Partial<AppDatabase>

  const settings: GoalSettings = {
    ...base.settings,
    ...(data.settings ?? {}),
    customSupplements:
      data.settings?.customSupplements ?? base.settings.customSupplements,
    requiredFields:
      data.settings?.requiredFields ?? base.settings.requiredFields,
  }

  const dailyLogs: Record<ISODate, DailyLog> = {}
  if (data.dailyLogs && typeof data.dailyLogs === 'object') {
    for (const [date, log] of Object.entries(data.dailyLogs)) {
      if (!log || typeof log !== 'object') continue
      dailyLogs[date] = { ...blankDailyLog(date), ...(log as DailyLog), date }
    }
  }

  return {
    version: DB_VERSION,
    settings,
    dailyLogs,
    futsalSessions: Array.isArray(data.futsalSessions)
      ? data.futsalSessions
      : [],
    workoutSessions: Array.isArray(data.workoutSessions)
      ? data.workoutSessions
      : [],
    meta: {
      ...base.meta,
      ...(data.meta ?? {}),
    },
  }
}

export { STORAGE_KEY }
