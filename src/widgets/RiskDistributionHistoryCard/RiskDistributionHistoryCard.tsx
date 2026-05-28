'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { RiskDistributionPoint } from '@/entities/analytics/model/types'
import { RiskLevel } from '@/entities/employee/model/types'
import { ChartHistogramIcon, DownloadIcon } from '@/shared/icons'
import { exportCsv } from '@/shared/lib/exportCsv'
import { Card } from '@/shared/ui/Card'

import s from './RiskDistributionHistoryCard.module.scss'

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

const STACK_ORDER: RiskLevel[] = ['low', 'medium', 'high', 'critical']

interface RiskDistributionHistoryCardProps {
  points: RiskDistributionPoint[]
}

export function RiskDistributionHistoryCard({ points }: RiskDistributionHistoryCardProps) {
  const handleExport = () => {
    const rows = points.map((point) => ({
      Месяц: point.month,
      Низкий: point.low,
      Средний: point.medium,
      Высокий: point.high,
      Критический: point.critical,
    }))
    exportCsv('risk-distribution-history.csv', rows)
  }

  return (
    <Card padding="lg" className={s.card}>
      <header className={s.header}>
        <div className={s.title}>
          <ChartHistogramIcon width={20} height={20} />
          <span>Динамика распределения риска</span>
        </div>
        <button
          type="button"
          className={s.exportBtn}
          onClick={handleExport}
          disabled={points.length === 0}
        >
          <DownloadIcon width={16} height={16} />
          <span>Экспорт CSV</span>
        </button>
      </header>

      {points.length === 0 ? (
        <div className={s.empty}>Нет исторических данных по риску</div>
      ) : (
        <div className={s.chartWrap}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
              <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {STACK_ORDER.map((level) => (
                <Area
                  key={level}
                  type="monotone"
                  dataKey={level}
                  name={RISK_LABEL[level]}
                  stackId="risk"
                  stroke={RISK_COLOR[level]}
                  fill={RISK_COLOR[level]}
                  fillOpacity={0.55}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
