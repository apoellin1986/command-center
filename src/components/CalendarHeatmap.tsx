import type { ISODate } from '../types'
import {
  dateRange,
  endOfMonth,
  parseISO,
  startOfMonth,
  todayISO,
  weekdayIndexMon,
} from '../utils/date'

interface Props {
  monthAnchor: ISODate
  /** 0 = none, 1–4 increasing intensity. */
  getLevel: (date: ISODate) => number
  onClickDay?: (date: ISODate) => void
  colorClass?: string // tailwind bg base for filled cells
}

const WD = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const levelOpacity = ['opacity-0', 'opacity-30', 'opacity-55', 'opacity-80', 'opacity-100']

export default function CalendarHeatmap({
  monthAnchor,
  getLevel,
  onClickDay,
  colorClass = 'bg-good',
}: Props) {
  const start = startOfMonth(monthAnchor)
  const end = endOfMonth(monthAnchor)
  const days = dateRange(start, end)
  const leadBlanks = weekdayIndexMon(start)
  const today = todayISO()

  return (
    <div>
      <div className="mb-1 grid grid-cols-7 gap-1.5">
        {WD.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-zinc-500">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: leadBlanks }).map((_, i) => (
          <div key={`b${i}`} />
        ))}
        {days.map((d) => {
          const future = d > today
          const level = future ? 0 : Math.max(0, Math.min(4, getLevel(d)))
          const day = parseISO(d).getDate()
          return (
            <button
              key={d}
              type="button"
              disabled={!onClickDay}
              onClick={() => onClickDay?.(d)}
              className={`relative aspect-square rounded-md text-[10px] font-medium transition-transform ${
                onClickDay ? 'active:scale-90' : ''
              } ${future ? 'bg-base-800/40 text-zinc-600' : 'bg-base-800 text-zinc-400'} ${
                d === today ? 'ring-1 ring-accent' : ''
              }`}
            >
              <span
                className={`absolute inset-0 rounded-md ${colorClass} ${levelOpacity[level]}`}
              />
              <span className="relative z-10">{day}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
