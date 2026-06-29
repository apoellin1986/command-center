interface Props {
  value: number // 0–100
  size?: number
  stroke?: number
  color?: string
  label?: string
  sublabel?: string
}

/** Circular discipline-score dial. */
export default function RingProgress({
  value,
  size = 132,
  stroke = 11,
  color = '#3b82f6',
  label,
  sublabel,
}: Props) {
  const clamped = Math.max(0, Math.min(100, value))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (clamped / 100) * c
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#242428" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-extrabold" style={{ color }}>
          {label ?? Math.round(clamped)}
        </span>
        {sublabel && <span className="text-xs text-zinc-400">{sublabel}</span>}
      </div>
    </div>
  )
}
