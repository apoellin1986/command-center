import type { ISODate } from '../types'
import Modal from './Modal'
import DailyChecklist, { RequiredChecklistStatus } from './DailyChecklist'
import { formatLong, isFuture } from '../utils/date'

interface Props {
  date: ISODate | null
  onClose: () => void
}

export default function DayLogModal({ date, onClose }: Props) {
  return (
    <Modal open={date != null} onClose={onClose} title={date ? formatLong(date) : ''}>
      {date && (
        <div className="flex flex-col gap-4">
          {isFuture(date) && (
            <div className="rounded-xl border border-warn/40 bg-warn/10 p-3 text-sm text-warn">
              This is a future date. You can pre-fill it, but it won't count until it arrives.
            </div>
          )}
          <RequiredChecklistStatus date={date} />
          <DailyChecklist date={date} />
          <p className="text-center text-xs text-zinc-500">Changes save automatically.</p>
        </div>
      )}
    </Modal>
  )
}
