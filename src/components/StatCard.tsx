import type { ReactNode } from 'react'

interface Props {
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: 'good' | 'warn' | 'bad' | 'neutral'
  icon?: ReactNode
  className?: string
}

const toneText: Record<string, string> = {
  good: 'text-good',
  warn: 'text-warn',
  bad: 'text-bad',
  neutral: 'text-zinc-100',
}

export default function StatCard({ label, value, sub, tone = 'neutral', icon, className = '' }: Props) {
  return (
    <div className={`card flex flex-col gap-1 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="field-label">{label}</span>
        {icon && <span className="text-zinc-500">{icon}</span>}
      </div>
      <span className={`text-2xl font-bold leading-tight ${toneText[tone]}`}>{value}</span>
      {sub != null && <span className="text-xs text-zinc-400">{sub}</span>}
    </div>
  )
}
