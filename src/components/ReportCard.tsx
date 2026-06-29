import type { ReactNode } from 'react'

interface Row {
  label: string
  value: ReactNode
  tone?: 'good' | 'warn' | 'bad' | 'neutral'
}

interface Props {
  title: string
  subtitle?: string
  rows: Row[]
  verdict?: { label: string; text: string; tone: 'good' | 'warn' | 'bad' | 'neutral' }
}

const toneText: Record<string, string> = {
  good: 'text-good',
  warn: 'text-warn',
  bad: 'text-bad',
  neutral: 'text-zinc-100',
}
const verdictBg: Record<string, string> = {
  good: 'border-good/40 bg-good/10',
  warn: 'border-warn/40 bg-warn/10',
  bad: 'border-bad/40 bg-bad/10',
  neutral: 'border-base-600 bg-base-800',
}

export default function ReportCard({ title, subtitle, rows, verdict }: Props) {
  return (
    <div className="card">
      <div className="mb-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-zinc-400">{subtitle}</p>}
      </div>
      <div className="divide-y divide-base-600/60">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between py-2 text-sm">
            <span className="text-zinc-400">{r.label}</span>
            <span className={`font-semibold ${toneText[r.tone ?? 'neutral']}`}>{r.value}</span>
          </div>
        ))}
      </div>
      {verdict && (
        <div className={`mt-3 rounded-xl border p-3 ${verdictBg[verdict.tone]}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{verdict.label}</p>
          <p className="mt-1 text-sm text-zinc-100">{verdict.text}</p>
        </div>
      )}
    </div>
  )
}
