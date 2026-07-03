import type { AppDatabase } from '../types'
import { migrate } from '../storage/db'
import { weightEntriesFromLogs } from './calculations'

/** @returns true if the file was shared/downloaded, false if the user
 * cancelled the iOS share sheet (so callers don't record a backup that
 * never actually left the app). */
async function download(filename: string, content: string, type: string): Promise<boolean> {
  const blob = new Blob([content], { type })

  // On iOS standalone PWAs the classic anchor-download is unreliable; the
  // native share sheet ("Save to Files") is the dependable path there.
  const file = new File([blob], filename, { type })
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return true
    } catch (e) {
      // User cancelled the sheet — done, don't also trigger a download.
      if (e instanceof DOMException && e.name === 'AbortError') return false
      // Anything else: fall through to the anchor download.
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  return true
}

function stamp(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Full backup. Stamps the payload's own lastBackupAt so the exported file
 * knows when it was made. @returns true if the export completed. */
export function exportJSON(db: AppDatabase): Promise<boolean> {
  const stamped: AppDatabase = {
    ...db,
    meta: { ...db.meta, lastBackupAt: Date.now() },
  }
  return download(`command-center-backup-${stamp()}.json`, JSON.stringify(stamped, null, 2), 'application/json')
}

export interface ImportResult {
  ok: boolean
  db?: AppDatabase
  error?: string
}

export function parseImportedJSON(text: string): ImportResult {
  try {
    const parsed = JSON.parse(text)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { ok: false, error: 'File does not contain a valid object.' }
    }
    // Reject files that are valid JSON but clearly not a Command Center
    // backup — migrating random JSON would "succeed" as an empty database
    // and silently destroy everything.
    const obj = parsed as Record<string, unknown>
    const hasLogs = typeof obj.dailyLogs === 'object' && obj.dailyLogs !== null
    const hasSettings = typeof obj.settings === 'object' && obj.settings !== null
    if (!hasLogs || !hasSettings) {
      return {
        ok: false,
        error: "This file doesn't look like a Command Center backup (missing dailyLogs/settings).",
      }
    }
    // migrate() hardens any partial / older shape into a safe DB.
    const db = migrate(parsed)
    return { ok: true, db }
  } catch {
    return { ok: false, error: 'Invalid JSON. The file could not be parsed.' }
  }
}

function csvEscape(v: string | number): string {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function exportWeightCSV(db: AppDatabase): void {
  const entries = weightEntriesFromLogs(db.dailyLogs)
  const rows = [['date', 'weight_kg'], ...entries.map((e) => [e.date, e.weightKg])]
  const csv = rows.map((r) => r.map(csvEscape).join(',')).join('\n')
  void download(`weight-log-${stamp()}.csv`, csv, 'text/csv') // CSV is lossy — not a real backup
}

export function exportDailyCSV(db: AppDatabase): void {
  const header = [
    'date', 'weight_kg', 'creatine', 'omega3', 'protein', 'pushups', 'futsal',
    'home_workout', 'cardio', 'water', 'sweets_avoided', 'notes',
  ]
  const logs = Object.values(db.dailyLogs).sort((a, b) => (a.date < b.date ? -1 : 1))
  const rows = [
    header,
    ...logs.map((l) => [
      l.date,
      l.weightKg ?? '',
      l.creatine ? 1 : 0,
      l.omega3 ? 1 : 0,
      l.protein ? 1 : 0,
      l.pushups ?? '',
      l.futsalPlayed ? 1 : 0,
      l.homeWorkout ? 1 : 0,
      l.cardio ? 1 : 0,
      l.waterTarget ? 1 : 0,
      l.sweetsAvoided ? 1 : 0,
      l.notes,
    ]),
  ]
  const csv = rows.map((r) => r.map(csvEscape).join(',')).join('\n')
  void download(`daily-checkins-${stamp()}.csv`, csv, 'text/csv')
}

/** Passes `null` when the file could not be read (instead of failing silently). */
export function pickFile(onText: (text: string | null) => void): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'application/json,.json'
  input.onchange = () => {
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onText(String(reader.result ?? ''))
    reader.onerror = () => onText(null)
    reader.readAsText(file)
  }
  input.click()
}
