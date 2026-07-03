import type { AppDatabase } from '../types'
import { formatShort, toISO } from './date'

const DAY = 86_400_000
export const BACKUP_STALE_DAYS = 7

export interface BackupStatus {
  lastBackupAt: number | null
  neverBackedUp: boolean
  daysSince: number | null
  hasData: boolean
  /** never backed up, or older than the stale threshold */
  overdue: boolean
  /** overdue AND there's real (non-demo) data worth protecting */
  shouldNudge: boolean
  /** human label, e.g. "Never", "Today", "3 days ago · 30 Jun" */
  label: string
  tone: 'good' | 'warn' | 'bad'
}

export function getBackupStatus(db: AppDatabase): BackupStatus {
  const last = db.meta.lastBackupAt ?? null
  const hasData =
    Object.keys(db.dailyLogs).length > 0 ||
    db.futsalSessions.length > 0 ||
    db.workoutSessions.length > 0

  const neverBackedUp = last == null
  const daysSince = last != null ? Math.floor((Date.now() - last) / DAY) : null
  const overdue = neverBackedUp || (daysSince != null && daysSince >= BACKUP_STALE_DAYS)
  // Don't nag on throwaway demo data or an empty fresh install.
  const shouldNudge = !db.meta.isDemo && hasData && overdue

  let tone: BackupStatus['tone'] = 'good'
  if (neverBackedUp && hasData) tone = 'bad'
  else if (overdue) tone = 'warn'

  return {
    lastBackupAt: last,
    neverBackedUp,
    daysSince,
    hasData,
    overdue,
    shouldNudge,
    label: labelFor(last),
    tone,
  }
}

function labelFor(last: number | null): string {
  if (last == null) return 'Never'
  const days = Math.floor((Date.now() - last) / DAY)
  const rel = days <= 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`
  return `${rel} · ${formatShort(toISO(new Date(last)))}`
}
