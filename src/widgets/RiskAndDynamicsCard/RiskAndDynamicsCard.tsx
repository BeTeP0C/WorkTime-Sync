'use client'

import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'

import { RiskLevel } from '@/entities/employee/model/types'
import { ActualityHistoryPoint } from '@/entities/dashboard/model/types'
import { ChartHistogramIcon, ChartPieIcon } from '@/shared/icons'
import { Card } from '@/shared/ui/Card'

import s from './RiskAndDynamicsCard.module.scss'

const RISK_COLOR: Record<RiskLevel, string> = {
  critical: '#dc2626',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#22c55e',
}

const RISK_LABEL: Record<RiskLevel, string> = {
  critical: 'Критический',
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
}

const ORDER: RiskLevel[] = ['critical', 'high', 'medium', 'low']

interface RiskAndDynamicsCardProps {
  distribution: Record<RiskLevel, number>
  history: ActualityHistoryPoint[]
}

export function RiskAndDynamicsCard({ distribution, history }: RiskAndDynamicsCardProps) {
  const donutData = ORDER.map((level) => ({
    name: RISK_LABEL[level],
    value: distribution[level] ?? 0,
    level,
  })).filter((d) => d.value > 0)

  return (
    <Card padding="lg" className={s.card}>
      <section className={s.section}>
        <header className={s.sectionHeader}>
          <ChartPieIcon width={20} height={20} />
          <span>Риск неактуальности</span>
        </header>
        <div className={s.donutRow}>
          <div className={s.donutWrap}>
            <PieChart width={143} height={143}>
              <Pie
                data={donutData}
                dataKey="value"
                cx={71}
                cy={71}
                innerRadius={48}
                outerRadius={68}
                startAngle={90}
                endAngle={-270}
                paddingAngle={0}
                stroke="none"
                isAnimationActive={false}
              >
                {donutData.map((d) => (
                  <Cell key={d.level} fill={RISK_COLOR[d.level]} />
                ))}
              </Pie>
            </PieChart>
            <div className={s.donutCenter}>Ri</div>
          </div>
          <ul className={s.legend}>
            {ORDER.map((level) => (
              <li key={level} className={s.legendItem}>
                <span className={s.legendDot} style={{ background: RISK_COLOR[level] }} />
                <span className={s.legendLabel}>{RISK_LABEL[level]}</span>
                <span className={s.legendValue}>{distribution[level] ?? 0}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={s.section}>
        <header className={s.sectionHeader}>
          <ChartHistogramIcon width={20} height={20} />
          <span>Динамика среднего Ai</span>
        </header>
        <div className={s.lineWrap}>
          <ResponsiveContainer width="100%" height={110}>
            <LineChart data={history} margin={{ top: 8, right: 16, left: 16, bottom: 0 }}>
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#8a93a8', fontSize: 13 }}
                interval={0}
              />
              <YAxis hide domain={['dataMin - 0.05', 'dataMax + 0.05']} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 3, fill: '#2563eb', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </Card>
  )
}
