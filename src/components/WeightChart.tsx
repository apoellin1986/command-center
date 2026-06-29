import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { MovingAveragePoint } from '../utils/calculations'
import { formatShort } from '../utils/date'

interface Props {
  data: MovingAveragePoint[]
  target?: number
}

export default function WeightChart({ data, target }: Props) {
  if (data.length < 2) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-zinc-500">
        Log at least 2 weigh-ins to see the trend.
      </div>
    )
  }
  const weights = data.map((d) => d.weight ?? 0)
  let min = Math.min(...weights)
  let max = Math.max(...weights)
  if (target != null) {
    min = Math.min(min, target)
    max = Math.max(max, target)
  }
  const pad = Math.max(0.5, (max - min) * 0.15)

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke="#242428" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatShort}
          tick={{ fill: '#71717a', fontSize: 11 }}
          minTickGap={28}
          axisLine={{ stroke: '#242428' }}
          tickLine={false}
        />
        <YAxis
          domain={[Math.floor(min - pad), Math.ceil(max + pad)]}
          tick={{ fill: '#71717a', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={{
            background: '#1a1a1d',
            border: '1px solid #242428',
            borderRadius: 12,
            color: '#fafafa',
            fontSize: 12,
          }}
          labelFormatter={(v) => formatShort(String(v))}
          formatter={(value: number, name: string) => [
            `${value} kg`,
            name === 'avg' ? '7-day avg' : 'Weight',
          ]}
        />
        {target != null && (
          <ReferenceLine
            y={target}
            stroke="#22c55e"
            strokeDasharray="5 4"
            label={{ value: `Target ${target}`, fill: '#22c55e', fontSize: 10, position: 'insideTopRight' }}
          />
        )}
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#52525b"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="avg"
          stroke="#3b82f6"
          strokeWidth={2.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
