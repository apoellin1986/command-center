import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatShort } from '../utils/date'

export interface BarDatum {
  date: string
  value: number
}

interface Props {
  data: BarDatum[]
  height?: number
  color?: string
  /** optional per-bar color decision */
  colorFor?: (d: BarDatum) => string
  unit?: string
  emptyMessage?: string
}

export default function BarChartSimple({
  data,
  height = 200,
  color = '#3b82f6',
  colorFor,
  unit = '',
  emptyMessage = 'No data yet.',
}: Props) {
  if (!data.some((d) => d.value > 0)) {
    return (
      <div className="flex items-center justify-center text-sm text-zinc-500" style={{ height }}>
        {emptyMessage}
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="#242428" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatShort}
          tick={{ fill: '#71717a', fontSize: 11 }}
          minTickGap={20}
          axisLine={{ stroke: '#242428' }}
          tickLine={false}
        />
        <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
        <Tooltip
          cursor={{ fill: '#ffffff10' }}
          contentStyle={{
            background: '#1a1a1d',
            border: '1px solid #242428',
            borderRadius: 12,
            color: '#fafafa',
            fontSize: 12,
          }}
          labelFormatter={(v) => formatShort(String(v))}
          formatter={(value: number) => [`${value}${unit}`, '']}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={colorFor ? colorFor(d) : color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
