interface Props<T extends string> {
  tabs: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
}

export default function Tabs<T extends string>({ tabs, value, onChange }: Props<T>) {
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
      {tabs.map((t) => {
        const active = t.value === value
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? 'bg-accent text-white'
                : 'bg-base-700 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
