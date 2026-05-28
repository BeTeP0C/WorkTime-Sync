'use client'

import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

import { RISK_LABEL_RU, RiskLevel } from '@/entities/employee/model/types'
import { Card, CardHeader } from '@/shared/ui/Card'

import s from './RiskDistributionChart.module.scss'

const COLORS: Record<RiskLevel, string> = {
  critical: '#dc2626',
  high: '#f97316',
  medium: '#facc15',
  low: '#16a34a',
}

const ORDER: RiskLevel[] = ['critical', 'high', 'medium', 'low']

interface RiskDistributionChartProps {
  distribution: Record<RiskLevel, number>
}

export function RiskDistributionChart({ distribution }: RiskDistributionChartProps) {
  const data = ORDER.map((level) => ({
    name: RISK_LABEL_RU[level],
    value: distribution[level] ?? 0,
    level,
  })).filter((d) => d.value > 0)

  const total = data.reduce((acc, d) => acc + d.value, 0)

  if (total === 0) {
    return (
      <Card padding="md" className={s.card}>
        <CardHeader title="Распределение по риску" className={s.title} />
        <div className={s.empty}>Нет данных за период</div>
      </Card>
    )
  }

  return (
    <Card padding="md" className={s.card}>
      <CardHeader title="Распределение по риску" className={s.title} />

      <div className={s.chartWrap}>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={50}
              outerRadius={70}
              startAngle={90}
              endAngle={-270}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.level} fill={COLORS[entry.level]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className={s.center}>{total}</div>
      </div>

      <div className={s.legend}>
        {data.map((d) => (
          <div key={d.level} className={s.legendRow}>
            <span className={s.legendDot} style={{ background: COLORS[d.level] }} />
            <span className={s.legendName}>{d.name}</span>
            <span className={s.legendValue}>{d.value}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
