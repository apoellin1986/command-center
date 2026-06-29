import { useMemo, useState } from 'react'
import { useStore } from '../storage/StoreContext'
import PageHeader from '../components/PageHeader'
import Tabs from '../components/Tabs'
import ReportCard from '../components/ReportCard'
import InsightCard from '../components/InsightCard'
import { generateMonthlyReport, generateWeeklyReport } from '../utils/reports'
import { generateInsights } from '../utils/insights'
import { scoreColor } from '../utils/calculations'
import { formatShort, todayISO } from '../utils/date'

type Tab = 'weekly' | 'monthly' | 'insights'

export default function ReportsPage() {
  const { db } = useStore()
  const [tab, setTab] = useState<Tab>('weekly')

  const weekly = useMemo(() => generateWeeklyReport(db), [db])
  const monthly = useMemo(() => generateMonthlyReport(db), [db])
  const insights = useMemo(() => generateInsights(db), [db])

  const changeTone = (v: number | null) =>
    v == null ? 'neutral' : v < 0 ? 'good' : v > 0 ? 'bad' : 'neutral'

  return (
    <div className="flex flex-col">
      <PageHeader title="Reports" subtitle="The honest picture" />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { label: 'Weekly', value: 'weekly' },
          { label: 'Monthly', value: 'monthly' },
          { label: 'Insights', value: 'insights' },
        ]}
      />

      {tab === 'weekly' && (
        <ReportCard
          title="This week"
          subtitle={`${formatShort(weekly.weekStart)} – ${formatShort(weekly.weekEnd)}`}
          rows={[
            { label: 'Start weight', value: weekly.startWeight != null ? `${weekly.startWeight} kg` : '—' },
            { label: 'End weight', value: weekly.endWeight != null ? `${weekly.endWeight} kg` : '—' },
            { label: 'Average weight', value: weekly.avgWeight != null ? `${weekly.avgWeight} kg` : '—' },
            { label: 'Weight change', value: weekly.weightChange != null ? `${weekly.weightChange > 0 ? '+' : ''}${weekly.weightChange} kg` : '—', tone: changeTone(weekly.weightChange) },
            { label: 'Discipline score', value: weekly.disciplineScore, tone: scoreColor(weekly.disciplineScore) },
            { label: 'Creatine', value: `${weekly.creatineCompliance}%`, tone: weekly.creatineCompliance >= 70 ? 'good' : 'bad' },
            { label: 'Vitamins', value: `${weekly.vitaminsCompliance}%` },
            { label: 'Push-ups total', value: weekly.pushupTotal },
            { label: 'Futsal sessions', value: weekly.futsalSessions },
            { label: 'Workout sessions', value: weekly.workoutSessions },
            { label: 'Best day', value: weekly.bestDay ? formatShort(weekly.bestDay) : '—', tone: 'good' },
            { label: 'Worst day', value: weekly.worstDay ? formatShort(weekly.worstDay) : '—', tone: 'warn' },
            { label: 'Main win', value: weekly.mainWin, tone: 'good' },
            { label: 'Main weakness', value: weekly.mainWeakness, tone: 'bad' },
          ]}
          verdict={{ label: 'Focus next week', text: weekly.focusNextWeek, tone: scoreColor(weekly.disciplineScore) }}
        />
      )}

      {tab === 'monthly' && (
        <ReportCard
          title={monthly.label}
          subtitle="Month to date"
          rows={[
            { label: 'Weight change', value: monthly.weightChange != null ? `${monthly.weightChange > 0 ? '+' : ''}${monthly.weightChange} kg` : '—', tone: changeTone(monthly.weightChange) },
            { label: 'Avg discipline', value: monthly.avgDisciplineScore, tone: scoreColor(monthly.avgDisciplineScore) },
            { label: 'Creatine', value: `${monthly.creatineCompliance}%`, tone: monthly.creatineCompliance >= 70 ? 'good' : 'bad' },
            { label: 'Vitamins', value: `${monthly.vitaminsCompliance}%` },
            { label: 'Push-ups total', value: monthly.pushupTotal },
            { label: 'Futsal sessions', value: monthly.futsalSessions },
            { label: 'Workouts', value: monthly.workoutSessions },
            { label: 'Best logging streak', value: `${monthly.bestStreak} days`, tone: 'good' },
            { label: 'Missed logging days', value: monthly.missedLoggingDays, tone: monthly.missedLoggingDays > 4 ? 'bad' : 'neutral' },
            { label: 'Strong days', value: monthly.strongDays, tone: 'good' },
            { label: 'Weak days', value: monthly.weakDays, tone: 'warn' },
          ]}
          verdict={{ label: 'Verdict', text: monthly.verdict, tone: scoreColor(monthly.avgDisciplineScore) }}
        />
      )}

      {tab === 'insights' && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-zinc-500">Generated locally from your data on {formatShort(todayISO())}.</p>
          {insights.map((i) => (
            <InsightCard key={i.id} insight={i} />
          ))}
        </div>
      )}
    </div>
  )
}
