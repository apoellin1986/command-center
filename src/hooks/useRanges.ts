import { useMemo } from 'react'
import { useStore } from '../storage/StoreContext'
import {
  addDays,
  dateRange,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from '../utils/date'
import { useToday } from './useToday'
import type { ISODate } from '../types'

export interface Ranges {
  today: ISODate
  week: ISODate[]
  lastWeek: ISODate[]
  month: ISODate[]
  /** every day from the earliest known data (or start date) to today */
  all: ISODate[]
}

/** Centralised date windows used by the stats across pages. */
export function useRanges(): Ranges {
  const { db } = useStore()
  const today = useToday() // reactive — rolls over at midnight / on resume
  return useMemo(() => {
    const logDates = Object.keys(db.dailyLogs)
    const sessionDates = [
      ...db.futsalSessions.map((s) => s.date),
      ...db.workoutSessions.map((s) => s.date),
    ]
    const candidates = [...logDates, ...sessionDates, db.settings.startDate]
    const earliest = candidates.length ? candidates.sort()[0] : addDays(today, -30)
    const start = earliest < today ? earliest : today
    return {
      today,
      week: dateRange(startOfWeek(today), endOfWeek(today)),
      lastWeek: dateRange(startOfWeek(addDays(today, -7)), endOfWeek(addDays(today, -7))),
      month: dateRange(startOfMonth(today), endOfMonth(today)),
      all: dateRange(start, today),
    }
  }, [db, today])
}
