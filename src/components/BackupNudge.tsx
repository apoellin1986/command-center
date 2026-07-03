import { useState } from 'react'
import { useBackup } from '../hooks/useBackup'

/**
 * Gentle, dismissible reminder shown on Today when a backup is overdue.
 * Dismissal is per-session only — it comes back next launch if still overdue,
 * because losing this data is the one failure that actually hurts.
 */
export default function BackupNudge() {
  const { status, busy, backupNow } = useBackup()
  const [dismissed, setDismissed] = useState(false)

  if (!status.shouldNudge || dismissed) return null

  const message = status.neverBackedUp
    ? "You've never backed up. All your data lives only on this phone — one tap saves it."
    : `Last backup was ${status.daysSince} days ago. Back up so a lost phone can't erase your progress.`

  return (
    <div className="rounded-2xl border border-warn/40 bg-warn/10 p-4">
      <p className="text-sm font-semibold text-warn">Protect your data</p>
      <p className="mt-1 text-sm text-zinc-300">{message}</p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => void backupNow()}
          disabled={busy}
          className="btn-primary flex-1 py-2 text-sm disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Back up now'}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="btn-ghost px-4 py-2 text-sm"
        >
          Later
        </button>
      </div>
    </div>
  )
}
