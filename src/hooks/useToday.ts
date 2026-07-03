import { useEffect, useState } from 'react'
import type { ISODate } from '../types'
import { todayISO } from '../utils/date'

/**
 * Today's date as reactive state. Plain `todayISO()` captured at render time
 * goes stale when an installed PWA is resumed from memory after midnight —
 * the first tap would then write into *yesterday's* log. This hook re-checks
 * the date on focus/visibility changes and on a slow interval, so the UI
 * (and anything keyed off it) rolls over correctly.
 */
export function useToday(): ISODate {
  const [today, setToday] = useState<ISODate>(todayISO)

  useEffect(() => {
    const check = () => {
      const now = todayISO()
      setToday((prev) => (prev === now ? prev : now))
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') check()
    }
    const id = window.setInterval(check, 30_000)
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return today
}
