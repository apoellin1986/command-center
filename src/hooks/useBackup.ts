import { useState } from 'react'
import { useStore } from '../storage/StoreContext'
import { exportJSON } from '../utils/exportImport'
import { getBackupStatus, type BackupStatus } from '../utils/backup'

interface UseBackup {
  status: BackupStatus
  busy: boolean
  /** Export a full JSON backup and record it if it actually completed. */
  backupNow: () => Promise<boolean>
}

export function useBackup(): UseBackup {
  const { db, markBackedUp } = useStore()
  const [busy, setBusy] = useState(false)

  const backupNow = async () => {
    setBusy(true)
    try {
      const ok = await exportJSON(db)
      if (ok) markBackedUp() // only record when the file really left the app
      return ok
    } finally {
      setBusy(false)
    }
  }

  return { status: getBackupStatus(db), busy, backupNow }
}
