import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: ReactNode
  right?: ReactNode
}

export default function PageHeader({ title, subtitle, right }: Props) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-zinc-400">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}
