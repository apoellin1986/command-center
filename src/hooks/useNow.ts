import { useEffect, useState } from 'react'

/**
 * Re-renders on an interval so live elapsed times stay current.
 * Pass `active = false` to stop ticking (no needless renders when idle).
 */
export function useNow(active: boolean, intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!active) return
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [active, intervalMs])

  return now
}
