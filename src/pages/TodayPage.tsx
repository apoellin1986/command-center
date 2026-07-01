import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../storage/StoreContext'
import { useRanges } from '../hooks/useRanges'
import PageHeader from '../components/PageHeader'
import RingProgress from '../components/RingProgress'
import DailyChecklist, { RequiredChecklistStatus } from '../components/DailyChecklist'
import StatCard from '../components/StatCard'
import { IconCalendar, IconFlame } from '../components/icons'
import {
  age,
  calculateCurrentStreak,
  calculateDailyDisciplineScore,
  calculateProteinWeek,
  calculateWeeklyAverage,
  calculateWeighInWeek,
  isDayComplete,
  isDayLogged,
  scoreColor,
  scoreVerdict,
} from '../utils/calculations'
import { daysBetween, formatLong, todayISO } from '../utils/date'

const colorHex = { good: '#22c55e', warn: '#f59e0b', bad: '#ef4444' }

export default function TodayPage() {
  const { db, getLog } = useStore()
  const ranges = useRanges()
  const today = todayISO()
  const log = getLog(today)
  const settings = db.settings

  const { score } = calculateDailyDisciplineScore(log, settings)
  const complete = isDayComplete(log, settings)
  const color = scoreColor(score)

  const { perfectStreak, loggingStreak, weekAvg } = useMemo(() => {
    const perfect = calculateCurrentStreak((d) => isDayComplete(db.dailyLogs[d], settings))
    const logging = calculateCurrentStreak((d) => isDayLogged(db.dailyLogs[d]))
    const weekScores = ranges.week
      .filter((d) => d <= today)
      .map((d) => calculateDailyDisciplineScore(db.dailyLogs[d], settings).score)
    return {
      perfectStreak: perfect,
      loggingStreak: logging,
      weekAvg: calculateWeeklyAverage(weekScores),
    }
  }, [db.dailyLogs, settings, ranges.week, today])

  const protein = calculateProteinWeek(db.dailyLogs, ranges.week, settings.weeklyProteinTarget)
  const weighIn = calculateWeighInWeek(db.dailyLogs, ranges.week, settings.weeklyWeightTarget)

  const daysToBirthday = daysBetween(today, settings.targetDate)
  const turning = age(settings.birthDate, settings.targetDate)

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Today"
        subtitle={formatLong(today)}
        right={
          <Link to="/calendar" className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-sm">
            <IconCalendar width={18} height={18} /> Calendar
          </Link>
        }
      />

      {/* Hero: discipline ring + verdict */}
      <div className="card flex items-center gap-5">
        <RingProgress value={score} color={colorHex[color]} sublabel="score" />
        <div className="flex-1">
          <p className="text-lg font-bold">{scoreVerdict(score)}</p>
          <p className="mt-1 text-sm text-zinc-400">
            {complete ? (
              <span className="text-good">✓ Today completed — required fields done.</span>
            ) : (
              'Required fields not yet complete.'
            )}
          </p>
          <div className="mt-3">
            <RequiredChecklistStatus date={today} />
          </div>
        </div>
      </div>

      {/* Streaks row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Perfect streak" value={perfectStreak} sub="days complete" tone={perfectStreak > 0 ? 'good' : 'neutral'} icon={<IconFlame width={18} height={18} />} />
        <StatCard label="Logging streak" value={loggingStreak} sub="days logged" />
        <StatCard label="Week avg" value={weekAvg} sub="discipline" tone={scoreColor(weekAvg)} />
      </div>

      {/* Weekly targets — protein & weigh-in */}
      <div className="card">
        <p className="field-label mb-3">This week's targets</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between rounded-xl bg-base-800 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Protein shakes</p>
              <p className="text-xs text-zinc-500">{protein.count} of {protein.target}</p>
            </div>
            <span className={`pill ${protein.met ? 'bg-good/20 text-good' : 'bg-base-700 text-zinc-400'}`}>
              {protein.met ? '✓ Met' : `${Math.max(0, protein.target - protein.count)} left`}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-base-800 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Weigh-in</p>
              <p className="text-xs text-zinc-500">{weighIn.count} of {weighIn.target}</p>
            </div>
            <span className={`pill ${weighIn.met ? 'bg-good/20 text-good' : 'bg-base-700 text-zinc-400'}`}>
              {weighIn.met ? '✓ Done' : 'Due'}
            </span>
          </div>
        </div>
      </div>

      {/* Birthday countdown — the deadline */}
      <div className="card flex items-center justify-between bg-gradient-to-br from-accent-muted/40 to-base-700">
        <div>
          <p className="field-label">Deadline</p>
          <p className="text-xl font-bold">Turning {turning}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-extrabold text-accent">{Math.max(0, daysToBirthday)}</p>
          <p className="text-xs text-zinc-400">days left</p>
        </div>
      </div>

      {/* The check-in */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold">Daily check-in</h2>
        <DailyChecklist date={today} />
        <p className="mt-4 text-center text-xs text-zinc-500">Everything saves automatically.</p>
      </div>
    </div>
  )
}
