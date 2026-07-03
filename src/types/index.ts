// ============================================================================
// Core data model. All dates are ISO 'YYYY-MM-DD' strings (local day keys).
// ============================================================================

export type ISODate = string // 'YYYY-MM-DD'

/** A single day's check-in. The heart of the app. */
export interface DailyLog {
  date: ISODate
  weightKg: number | null // logged weekly, not daily
  creatine: boolean
  omega3: boolean
  protein: boolean // weekly target (2x/week), still ticked per-day
  pushups: number | null
  futsalPlayed: boolean
  homeWorkout: boolean
  cardio: boolean
  waterTarget: boolean
  sweetsAvoided: boolean
  notes: string
  /** Custom user-added supplements tracked by id -> taken */
  customSupplements: Record<string, boolean>
  updatedAt: number // epoch ms, for conflict-free imports
}

/** Weight is also queryable on its own (sourced from daily logs). */
export interface WeightEntry {
  date: ISODate
  weightKg: number
}

/** Derived per-supplement compliance view. */
export interface SupplementLog {
  id: string
  name: string
  taken: boolean
  date: ISODate
}

export type Intensity = 'Low' | 'Medium' | 'High'

export interface FutsalSession {
  id: string
  date: ISODate
  durationMin: number
  intensity: Intensity
  performance: number // 1–10
  hydration: number // 1–5
  energyBefore: number // 1–5 (used for insights)
  notes: string
}

export type WorkoutType =
  | 'Push'
  | 'Pull'
  | 'Legs'
  | 'Full Body'
  | 'Core'
  | 'Treadmill/Cardio'
  | 'Recovery/Mobility'

export interface ExerciseEntry {
  id: string
  name: string
  sets: number | null
  reps: number | null
  weightKg: number | null
  notes: string
}

export interface WorkoutSession {
  id: string
  date: ISODate
  type: WorkoutType
  durationMin: number
  intensity: Intensity
  completed: boolean
  notes: string
  exercises: ExerciseEntry[]
}

export interface CustomSupplement {
  id: string
  name: string
  enabled: boolean
}

export interface GoalSettings {
  weightUnit: 'kg'
  startWeightKg: number
  targetWeightKg: number
  targetDate: ISODate
  startDate: ISODate
  dailyPushupTarget: number
  monthlyPushupTarget: number
  weeklyFutsalTarget: number
  weeklyWorkoutTarget: number
  weeklyProteinTarget: number // shakes per week (default 2)
  weeklyWeightTarget: number // weigh-ins per week (default 1)
  waterGoalDescription: string
  customSupplements: CustomSupplement[]
  /** Which daily fields are required for a "complete" day. */
  requiredFields: RequiredField[]
  birthDate: ISODate
}

export type RequiredField =
  | 'creatine'
  | 'omega3'
  | 'pushups'
  | 'waterTarget'
  | 'training' // futsal OR home workout

export type InsightTone = 'good' | 'warn' | 'bad' | 'neutral'

export interface Insight {
  id: string
  text: string
  tone: InsightTone
}

export interface WeeklyReport {
  weekStart: ISODate
  weekEnd: ISODate
  startWeight: number | null
  endWeight: number | null
  avgWeight: number | null
  weightChange: number | null
  disciplineScore: number
  creatineCompliance: number
  omega3Compliance: number
  proteinDays: number // shakes logged this week
  weighIns: number // weigh-ins logged this week
  pushupTotal: number
  futsalSessions: number
  workoutSessions: number
  bestDay: ISODate | null
  worstDay: ISODate | null
  mainWeakness: string
  mainWin: string
  focusNextWeek: string
}

export interface MonthlyReport {
  monthKey: string // 'YYYY-MM'
  label: string
  weightChange: number | null
  avgDisciplineScore: number
  creatineCompliance: number
  omega3Compliance: number
  pushupTotal: number
  futsalSessions: number
  workoutSessions: number
  bestStreak: number
  missedLoggingDays: number
  strongDays: number
  weakDays: number
  verdict: string
}

/** The full persisted database. Versioned for future-proof migrations. */
export interface AppDatabase {
  version: number
  settings: GoalSettings
  dailyLogs: Record<ISODate, DailyLog>
  futsalSessions: FutsalSession[]
  workoutSessions: WorkoutSession[]
  meta: {
    createdAt: number
    onboarded: boolean
    isDemo: boolean
    /** epoch ms of the last full JSON export; null = never backed up */
    lastBackupAt: number | null
  }
}
