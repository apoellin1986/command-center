import type { AppDatabase } from '../types'
import { migrate } from '../storage/db'
import { weightEntriesFromLogs } from './calculations'

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function stamp(): string {
  return new Date().toISOString().slice(0, 10)
}

export function exportJSON(db: AppDatabase): void {
  download(`command-center-backup-${stamp()}.json`, JSON.stringify(db, null, 2), 'application/json')
}

export interface ImportResult {
  ok: boolean
  db?: AppDatabase
  error?: string
}

export function parseImportedJSON(text: string): ImportResult {
  try {
    const parsed = JSON.parse(text)
    if (typeof parsed !== 'object' || parsed === null) {
      return { ok: false, error: 'File does not contain a valid object.' }
    }
    // migrate() hardens any partial / older shape into a safe DB.
    const db = migrate(parsed)
    return { ok: true, db }
  } catch (e) {
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
  download(`weight-log-${stamp()}.csv`, csv, 'text/csv')
}

export function exportDailyCSV(db: AppDatabase): void {
  const header = [
    'date', 'weight_kg', 'creatine', 'vitamins', 'pushups', 'futsal',
    'home_workout', 'cardio', 'water', 'sweets_avoided', 'sleep_quality', 'notes',
  ]
  const logs = Object.values(db.dailyLogs).sort((a, b) => (a.date < b.date ? -1 : 1))
  const rows = [
    header,
    ...logs.map((l) => [
      l.date,
      l.weightKg ?? '',
      l.creatine ? 1 : 0,
      l.vitamins ? 1 : 0,
      l.pushups ?? '',
      l.futsalPlayed ? 1 : 0,
      l.homeWorkout ? 1 : 0,
      l.cardio ? 1 : 0,
      l.waterTarget ? 1 : 0,
      l.sweetsAvoided ? 1 : 0,
      l.sleepQuality ?? '',
      l.notes,
    ]),
  ]
  const csv = rows.map((r) => r.map(csvEscape).join(',')).join('\n')
  download(`daily-checkins-${stamp()}.csv`, csv, 'text/csv')
}

export function pickFile(onText: (text: string) => void): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'application/json,.json'
  input.onchange = () => {
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onText(String(reader.result ?? ''))
    reader.readAsText(file)
  }
  input.click()
}
