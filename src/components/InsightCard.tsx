import type { Insight } from '../types'

const toneStyles: Record<Insight['tone'], string> = {
  good: 'border-good/40 bg-good/10 text-good',
  warn: 'border-warn/40 bg-warn/10 text-warn',
  bad: 'border-bad/40 bg-bad/10 text-bad',
  neutral: 'border-base-600 bg-base-800 text-zinc-300',
}

const dot: Record<Insight['tone'], string> = {
  good: 'bg-good',
  warn: 'bg-warn',
  bad: 'bg-bad',
  neutral: 'bg-zinc-500',
}

export default function InsightCard({ insight }: { insight: Insight }) {
  return (
    <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${toneStyles[insight.tone]}`}>
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot[insight.tone]}`} />
      <p className="text-sm leading-snug text-zinc-100">{insight.text}</p>
    </div>
  )
}
