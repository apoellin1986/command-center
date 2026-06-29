import { useState } from 'react'
import type { ISODate } from '../types'
import { useStore } from '../storage/StoreContext'
import PageHeader from '../components/PageHeader'
import DayLogModal from '../components/DayLogModal'
import { IconChevron } from '../components/icons'
import {
  addDays,
  dateRange,
  endOfMonth,
  formatMonthLabel,
  monthKey,
  parseISO,
  startOfMonth,
  todayISO,
  weekdayIndexMon,
} from '../utils/date'
import { isDayComplete } from '../utils/calculations'

const WD = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// indicator dots: weight, creatine, vitamins, pushups, futsal, workout, water
const indicators: { key: string; color: string; test: (l: any) => boolean }[] = [
  { key: 'w', color: 'bg-blue-400', test: (l) => l.weightKg != null },
  { key: 'c', color: 'bg-emerald-400', test: (l) => l.creatine },
  { key: 'v', color: 'bg-violet-400', test: (l) => l.vitamins },
  { key: 'p', color: 'bg-amber-400', test: (l) => (l.pushups ?? 0) > 0 },
  { key: 'f', color: 'bg-rose-400', test: (l) => l.futsalPlayed },
  { key: 'g', color: 'bg-orange-400', test: (l) => l.homeWorkout },
  { key: 'h', color: 'bg-cyan-400', test: (l) => l.waterTarget },
]

export default function CalendarPage() {
  const { db } = useStore()
  const [anchor, setAnchor] = useState<ISODate>(todayISO())
  const [selected, setSelected] = useState<ISODate | null>(null)

  const start = startOfMonth(anchor)
  const days = dateRange(start, endOfMonth(anchor))
  const lead = weekdayIndexMon(start)
  const today = todayISO()

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Calendar" subtitle="Tap any day to edit its full log" />

      <div className="flex items-center justify-between">
        <button onClick={() => setAnchor(addDays(start, -1))} className="btn-ghost px-3 py-2">
          <IconChevron width={18} height={18} className="rotate-180" />
        </button>
        <h2 className="text-lg font-semibold">{formatMonthLabel(monthKey(anchor))}</h2>
        <button
          onClick={() => setAnchor(addDays(endOfMonth(anchor), 1))}
          className="btn-ghost px-3 py-2 disabled:opacity-40"
          disabled={monthKey(anchor) >= monthKey(today)}
        >
          <IconChevron width={18} height={18} />
        </button>
      </div>

      <div className="card">
        <div className="mb-2 grid grid-cols-7 gap-1">
          {WD.map((d, i) => (
            <div key={i} className="text-center text-[10px] font-medium text-zinc-500">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: lead }).map((_, i) => <div key={`b${i}`} />)}
          {days.map((d) => {
            const log = db.dailyLogs[d]
            const future = d > today
            const complete = log && isDayComplete(log, db.settings)
            const missed = !future && !log
            return (
              <button
                key={d}
                onClick={() => setSelected(d)}
                className={`relative flex aspect-square flex-col items-center justify-start rounded-lg p-1 text-xs transition-transform active:scale-90 ${
                  future ? 'bg-base-800/40 text-zinc-600' : 'bg-base-800 text-zinc-300'
                } ${d === today ? 'ring-1 ring-accent' : ''} ${missed ? 'opacity-60' : ''} ${complete ? 'border border-good/40' : ''}`}
              >
                <span className="font-medium">{parseISO(d).getDate()}</span>
                {log && (
                  <span className="mt-auto flex flex-wrap justify-center gap-0.5">
                    {indicators.filter((ind) => ind.test(log)).map((ind) => (
                      <span key={ind.key} className={`h-1 w-1 rounded-full ${ind.color}`} />
                    ))}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="card flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-400">
        {[
          ['bg-blue-400', 'Weight'], ['bg-emerald-400', 'Creatine'], ['bg-violet-400', 'Vitamins'],
          ['bg-amber-400', 'Push-ups'], ['bg-rose-400', 'Futsal'], ['bg-orange-400', 'Workout'], ['bg-cyan-400', 'Water'],
        ].map(([c, label]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${c}`} /> {label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded border border-good/60" /> Complete day
        </span>
      </div>

      <DayLogModal date={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
