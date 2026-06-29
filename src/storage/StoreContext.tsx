import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type {
  AppDatabase,
  DailyLog,
  FutsalSession,
  GoalSettings,
  ISODate,
  WorkoutSession,
} from '../types'
import {
  blankDailyLog,
  emptyDatabase,
  loadDatabase,
  saveDatabase,
} from './db'
import { todayISO } from '../utils/date'
import { generateDemoDatabase } from '../data/demoData'

interface StoreContextValue {
  db: AppDatabase
  ready: boolean
  // daily logs
  getLog: (date: ISODate) => DailyLog
  updateLog: (date: ISODate, patch: Partial<DailyLog>) => void
  // sessions
  addFutsal: (s: FutsalSession) => void
  updateFutsal: (id: string, patch: Partial<FutsalSession>) => void
  deleteFutsal: (id: string) => void
  addWorkout: (s: WorkoutSession) => void
  updateWorkout: (id: string, patch: Partial<WorkoutSession>) => void
  deleteWorkout: (id: string) => void
  // settings
  updateSettings: (patch: Partial<GoalSettings>) => void
  // lifecycle
  onboardFresh: () => void
  onboardDemo: () => void
  importDatabase: (db: AppDatabase) => void
  resetAll: () => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<AppDatabase>(() => loadDatabase() ?? emptyDatabase())
  const [ready, setReady] = useState(false)
  const firstRun = useRef(true)

  // mark ready after mount (load already happened in initializer)
  useEffect(() => {
    setReady(true)
  }, [])

  // auto-save on every change (skip the very first render)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    saveDatabase(db)
  }, [db])

  const value = useMemo<StoreContextValue>(() => {
    const getLog = (date: ISODate): DailyLog =>
      db.dailyLogs[date] ?? blankDailyLog(date)

    const updateLog = (date: ISODate, patch: Partial<DailyLog>) => {
      setDb((prev) => {
        const existing = prev.dailyLogs[date] ?? blankDailyLog(date)
        const next: DailyLog = { ...existing, ...patch, date, updatedAt: Date.now() }
        return {
          ...prev,
          dailyLogs: { ...prev.dailyLogs, [date]: next },
          meta: { ...prev.meta, onboarded: true },
        }
      })
    }

    const addFutsal = (s: FutsalSession) =>
      setDb((p) => ({ ...p, futsalSessions: [...p.futsalSessions, s] }))
    const updateFutsal = (id: string, patch: Partial<FutsalSession>) =>
      setDb((p) => ({
        ...p,
        futsalSessions: p.futsalSessions.map((x) => (x.id === id ? { ...x, ...patch } : x)),
      }))
    const deleteFutsal = (id: string) =>
      setDb((p) => ({ ...p, futsalSessions: p.futsalSessions.filter((x) => x.id !== id) }))

    const addWorkout = (s: WorkoutSession) =>
      setDb((p) => ({ ...p, workoutSessions: [...p.workoutSessions, s] }))
    const updateWorkout = (id: string, patch: Partial<WorkoutSession>) =>
      setDb((p) => ({
        ...p,
        workoutSessions: p.workoutSessions.map((x) => (x.id === id ? { ...x, ...patch } : x)),
      }))
    const deleteWorkout = (id: string) =>
      setDb((p) => ({ ...p, workoutSessions: p.workoutSessions.filter((x) => x.id !== id) }))

    const updateSettings = (patch: Partial<GoalSettings>) =>
      setDb((p) => ({ ...p, settings: { ...p.settings, ...patch } }))

    const onboardFresh = () =>
      setDb(() => {
        const fresh = emptyDatabase()
        fresh.settings.startDate = todayISO()
        fresh.meta.onboarded = true
        return fresh
      })

    const onboardDemo = () => setDb(() => generateDemoDatabase())

    const importDatabase = (incoming: AppDatabase) =>
      setDb(() => ({ ...incoming, meta: { ...incoming.meta, onboarded: true } }))

    const resetAll = () => setDb(() => emptyDatabase())

    return {
      db, ready, getLog, updateLog,
      addFutsal, updateFutsal, deleteFutsal,
      addWorkout, updateWorkout, deleteWorkout,
      updateSettings, onboardFresh, onboardDemo, importDatabase, resetAll,
    }
  }, [db, ready])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
