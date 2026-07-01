import type {
  AppDatabase,
  DailyLog,
  FutsalSession,
  Intensity,
  WorkoutSession,
  WorkoutType,
} from '../types'
import { blankDailyLog, defaultSettings } from '../storage/db'
import { addDays, lastNDays, parseISO, todayISO } from '../utils/date'

// Deterministic-ish pseudo random so demo looks consistent enough.
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

/** Realistic 30-day sample so the app shows its value immediately. */
export function generateDemoDatabase(): AppDatabase {
  const settings = defaultSettings()
  settings.startWeightKg = 91.5
  settings.startDate = addDays(todayISO(), -29)

  const r = rng(42)
  const dates = lastNDays(30)
  const dailyLogs: Record<string, DailyLog> = {}

  let weight = 91.5
  dates.forEach((date, i) => {
    const dow = parseISO(date).getDay()
    const isWeekend = dow === 0 || dow === 6
    const log = blankDailyLog(date)

    // gentle downward weight trend with noise
    weight -= 0.12 + (r() - 0.5) * 0.5
    if (isWeekend && r() > 0.5) weight += 0.3 // weekend bumps
    log.weightKg = Math.round(weight * 10) / 10

    // habits — strong on weekdays, leakier on weekends
    const disciplined = isWeekend ? r() > 0.45 : r() > 0.12
    log.creatine = r() > (isWeekend ? 0.35 : 0.1)
    log.omega3 = r() > 0.25
    log.protein = r() > 0.6 // ~2-3x/week
    log.waterTarget = disciplined && r() > 0.2
    log.sweetsAvoided = isWeekend ? r() > 0.6 : r() > 0.25
    log.pushups = disciplined ? 30 + Math.floor(r() * 45) : (r() > 0.5 ? Math.floor(r() * 20) : 0)
    log.cardio = r() > 0.6

    // training
    const playedFutsal = (dow === 2 || dow === 5) && r() > 0.2
    log.futsalPlayed = playedFutsal
    log.homeWorkout = !playedFutsal && disciplined && r() > 0.45

    if (r() > 0.6) {
      log.notes = pick(r, [
        'Felt strong.', 'Tired but showed up.', 'Too many sweets today.',
        'Good energy.', 'Legs heavy after futsal.', 'Slept badly.',
      ])
    }

    log.updatedAt = Date.now() - (29 - i) * 86400000
    dailyLogs[date] = log
  })

  // Futsal sessions matching the futsal days
  const futsalSessions: FutsalSession[] = []
  for (const date of dates) {
    if (dailyLogs[date]?.futsalPlayed) {
      const intensity = pick(r, ['Medium', 'High', 'High'] as Intensity[])
      futsalSessions.push({
        id: `demo-futsal-${date}`,
        date,
        durationMin: 50 + Math.floor(r() * 30),
        intensity,
        performance: 5 + Math.floor(r() * 5),
        hydration: 2 + Math.floor(r() * 4),
        energyBefore: 2 + Math.floor(r() * 4),
        notes: r() > 0.6 ? 'Good game.' : '',
      })
    }
  }

  // Workout sessions matching home-workout days
  const workoutTypes: WorkoutType[] = ['Push', 'Pull', 'Legs', 'Full Body', 'Core']
  const workoutSessions: WorkoutSession[] = []
  for (const date of dates) {
    if (dailyLogs[date]?.homeWorkout) {
      workoutSessions.push({
        id: `demo-workout-${date}`,
        date,
        type: pick(r, workoutTypes),
        durationMin: 25 + Math.floor(r() * 35),
        intensity: pick(r, ['Low', 'Medium', 'High'] as Intensity[]),
        completed: true,
        notes: '',
        exercises: [],
      })
    }
  }

  return {
    version: 1,
    settings,
    dailyLogs,
    futsalSessions,
    workoutSessions,
    meta: { createdAt: Date.now(), onboarded: true, isDemo: true },
  }
}

function pick<T>(r: () => number, arr: T[]): T {
  return arr[Math.floor(r() * arr.length)]
}
