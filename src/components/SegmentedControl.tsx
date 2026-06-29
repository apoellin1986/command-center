interface Props<T extends string | number> {
  options: { label: string; value: T }[]
  value: T | null
  onChange: (v: T) => void
  className?: string
}

export default function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  className = '',
}: Props<T>) {
  return (
    <div className={`flex gap-1 rounded-xl bg-base-800 p-1 ${className}`}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
              active ? 'bg-accent text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
