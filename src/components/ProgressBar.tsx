interface Props {
  value: number // 0–100
  tone?: 'good' | 'warn' | 'bad' | 'accent'
  height?: number
  showLabel?: boolean
  className?: string
}

const toneBg: Record<string, string> = {
  good: 'bg-good',
  warn: 'bg-warn',
  bad: 'bg-bad',
  accent: 'bg-accent',
}

export default function ProgressBar({
  value,
  tone = 'accent',
  height = 8,
  showLabel = false,
  className = '',
}: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className={className}>
      <div className="w-full rounded-full bg-base-800 overflow-hidden" style={{ height }}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${toneBg[tone]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && <div className="mt-1 text-right text-xs text-zinc-400">{clamped}%</div>}
    </div>
  )
}
