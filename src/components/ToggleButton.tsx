import type { ReactNode } from 'react'

interface Props {
  label: string
  value: boolean
  onChange: (v: boolean) => void
  icon?: ReactNode
  hint?: string
  /** when true, an "off" state reads as a problem (red) rather than neutral */
  strict?: boolean
}

/** Large tap-friendly yes/no control for fast daily entry. */
export default function ToggleButton({ label, value, onChange, icon, hint, strict }: Props) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      aria-pressed={value}
      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-colors active:scale-[0.99] ${
        value
          ? 'border-good/50 bg-good/10'
          : strict
            ? 'border-base-600 bg-base-800'
            : 'border-base-600 bg-base-800'
      }`}
    >
      <span className="flex items-center gap-3">
        {icon && (
          <span className={value ? 'text-good' : 'text-zinc-500'}>{icon}</span>
        )}
        <span className="flex flex-col">
          <span className="font-semibold text-zinc-100">{label}</span>
          {hint && <span className="text-xs text-zinc-500">{hint}</span>}
        </span>
      </span>
      <span
        className={`pill ${
          value ? 'bg-good/20 text-good' : 'bg-base-700 text-zinc-400'
        }`}
      >
        {value ? 'YES' : 'NO'}
      </span>
    </button>
  )
}
