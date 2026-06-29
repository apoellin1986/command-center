interface Props {
  value: number | null
  onChange: (v: number | null) => void
  step?: number
  quickAdds?: number[]
  min?: number
  placeholder?: string
  suffix?: string
}

/** Numeric entry with big +/- and quick-add chips — minimal typing. */
export default function NumberStepper({
  value,
  onChange,
  step = 1,
  quickAdds = [],
  min = 0,
  placeholder = '0',
  suffix,
}: Props) {
  const cur = value ?? 0
  const set = (v: number) => onChange(Math.max(min, v))

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => set(cur - step)} className="btn-ghost h-12 w-12 text-xl">
          −
        </button>
        <div className="relative flex-1">
          <input
            type="number"
            inputMode="numeric"
            value={value ?? ''}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value === '' ? null : Math.max(min, Number(e.target.value)))}
            className="input text-center text-xl font-bold"
          />
          {suffix && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
              {suffix}
            </span>
          )}
        </div>
        <button type="button" onClick={() => set(cur + step)} className="btn-ghost h-12 w-12 text-xl">
          +
        </button>
      </div>
      {quickAdds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {quickAdds.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => set(cur + q)}
              className="pill bg-base-700 text-zinc-300 hover:bg-base-600"
            >
              +{q}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
