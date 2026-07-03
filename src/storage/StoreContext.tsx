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
  FastingSession,
  FutsalSession,
  GoalSettings,
  ISODate,
  WorkoutSession,
} from '../types'
import {
  blankDailyLog,
  emptyDatabase,
  loadDatabase,
  migrate,
  saveDatabase,
  STORAGE_KEY,
} from './db'
import { todayISO } from '../utils/date'
import { generateDemoDatabase } from '../data/demoData'

interface StoreContextValue {
  db: AppDatabase
  ready: boolean
  /** True when the last persist to localStorage failed (quota / private mode). */
  saveFailed: boolean
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
  // fasting
  startFast: (goalHours: number) => void
  endFast: () => void
  addFast: (s: FastingSession) => void
  updateFast: (id: string, patch: Partial<FastingSession>) => void
  deleteFast: (id: string) => void
  // settings
  updateSettings: (patch: Partial<GoalSettings>) => void
  /** record that a full JSON backup was just taken */
  markBackedUp: () => void
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
  const [saveFailed, setSaveFailed] = useState(false)
  const firstRun = useRef(true)
  const dbRef = useRef(db)
  dbRef.current = db

  // mark ready after mount (load already happened in initializer)
  useEffect(() => {
    setReady(true)
  }, [])

  // Debounced auto-save: coalesces rapid changes (e.g. typing in notes) into
  // one localStorage write instead of serializing the whole DB per keystroke.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    const t = window.setTimeout(() => {
      setSaveFailed(!saveDatabase(dbRef.current))
    }, 300)
    return () => window.clearTimeout(t)
  }, [db])

  // Flush pending writes when the app is backgrounded/closed so the debounce
  // window can't drop the last change on an iOS PWA suspend.
  useEffect(() => {
    const flush = () => {
      saveDatabase(dbRef.current)
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  // If another tab writes the DB, adopt its state instead of silently
  // overwriting it with ours on the next save (last-writer-wins data loss).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || e.newValue == null) return
      try {
        setDb(migrate(JSON.parse(e.newValue)))
      } catch {
        /* ignore malformed cross-tab payloads */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

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
      setDb((p) => {
        const victim = p.futsalSessions.find((x) => x.id === id)
        const rest = p.futsalSessions.filter((x) => x.id !== id)
        let dailyLogs = p.dailyLogs
        // Logging a session auto-set the day's flag; deleting the last session
        // on that date takes the credit back so scores/completion stay honest.
        if (victim && !rest.some((s) => s.date === victim.date)) {
          const log = dailyLogs[victim.date]
          if (log?.futsalPlayed) {
            dailyLogs = {
              ...dailyLogs,
              [victim.date]: { ...log, futsalPlayed: false, updatedAt: Date.now() },
            }
          }
        }
        return { ...p, futsalSessions: rest, dailyLogs }
      })

    const addWorkout = (s: WorkoutSession) =>
      setDb((p) => ({ ...p, workoutSessions: [...p.workoutSessions, s] }))
    const updateWorkout = (id: string, patch: Partial<WorkoutSession>) =>
      setDb((p) => ({
        ...p,
        workoutSessions: p.workoutSessions.map((x) => (x.id === id ? { ...x, ...patch } : x)),
      }))
    const deleteWorkout = (id: string) =>
      setDb((p) => {
        const victim = p.workoutSessions.find((x) => x.id === id)
        const rest = p.workoutSessions.filter((x) => x.id !== id)
        let dailyLogs = p.dailyLogs
        if (victim && !rest.some((s) => s.date === victim.date && s.completed)) {
          const log = dailyLogs[victim.date]
          if (log?.homeWorkout) {
            dailyLogs = {
              ...dailyLogs,
              [victim.date]: { ...log, homeWorkout: false, updatedAt: Date.now() },
            }
          }
        }
        return { ...p, workoutSessions: rest, dailyLogs }
      })

    // Fasting — at most one active fast (endAt null) at a time.
    const startFast = (goalHours: number) =>
      setDb((p) => {
        if (p.fastingSessions.some((s) => s.endAt == null)) return p // already fasting
        const session: FastingSession = {
          id: `fast-${Date.now()}`,
          startAt: Date.now(),
          endAt: null,
          goalHours,
          notes: '',
        }
        return { ...p, fastingSessions: [...p.fastingSessions, session] }
      })
    const endFast = () =>
      setDb((p) => ({
        ...p,
        fastingSessions: p.fastingSessions.map((s) =>
          s.endAt == null ? { ...s, endAt: Date.now() } : s,
        ),
      }))
    const addFast = (s: FastingSession) =>
      setDb((p) => ({ ...p, fastingSessions: [...p.fastingSessions, s] }))
    const updateFast = (id: string, patch: Partial<FastingSession>) =>
      setDb((p) => ({
        ...p,
        fastingSessions: p.fastingSessions.map((x) => (x.id === id ? { ...x, ...patch } : x)),
      }))
    const deleteFast = (id: string) =>
      setDb((p) => ({ ...p, fastingSessions: p.fastingSessions.filter((x) => x.id !== id) }))

    const updateSettings = (patch: Partial<GoalSettings>) =>
      setDb((p) => ({ ...p, settings: { ...p.settings, ...patch } }))

    const markBackedUp = () =>
      setDb((p) => ({ ...p, meta: { ...p.meta, lastBackupAt: Date.now() } }))

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
      db, ready, saveFailed, getLog, updateLog,
      addFutsal, updateFutsal, deleteFutsal,
      addWorkout, updateWorkout, deleteWorkout,
      startFast, endFast, addFast, updateFast, deleteFast,
      updateSettings, markBackedUp, onboardFresh, onboardDemo, importDatabase, resetAll,
    }
  }, [db, ready, saveFailed])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
