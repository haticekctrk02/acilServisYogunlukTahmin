import { Line, LineChart, ResponsiveContainer } from 'recharts'

interface SparklineProps {
  data: number[]
  color?: string
}

export function Sparkline({ data, color = '#2563EB' }: SparklineProps) {
  const chartData = data.map((v, i) => ({ i, v }))
  return (
    <div className="kpi-sparkline" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
