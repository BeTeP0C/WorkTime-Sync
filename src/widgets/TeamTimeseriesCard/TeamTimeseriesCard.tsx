'use client'

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { TeamMetricsHistoryPoint } from '@/entities/analytics/model/types'
import { ActivityIcon, DownloadIcon } from '@/shared/icons'
import { exportCsv } from '@/shared/lib/exportCsv'
import { formatScore } from '@/shared/lib/format'
import { Card } from '@/shared/ui/Card'

import s from './TeamTimeseriesCard.module.scss'

const COLOR_AI = '#22c55e'
const COLOR_RI = '#f97316'
const COLOR_ATTENTION = '#dc2626'

interface TeamTimeseriesCardProps {
  teamName: string
  teamId: string | null
  points: TeamMetricsHistoryPoint[]
}

export function TeamTimeseriesCard({ teamName, teamId, points }: TeamTimeseriesCardProps) {
  const handleExport = () => {
    const rows = points.map((point) => ({
      Месяц: point.month,
      'Средний Ai': formatScore(point.avgActuality),
      'Средний Ri': formatScore(point.avgRiskScore),
      'Требуют внимания': point.attentionCount,
    }))
    exportCsv(`team-metrics-history-${teamId ?? 'team'}.csv`, rows)
  }

  return (
    <Card padding="lg" className={s.card}>
      <header className={s.header}>
        <div className={s.title}>
          <ActivityIcon width={20} height={20} />
          <span>Динамика команды{teamName ? `: ${teamName}` : ''}</span>
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
        <div className={s.empty}>
          {teamId ? 'Нет снимков по выбранной команде' : 'Выберите команду'}
        </div>
      ) : (
        <div className={s.chartWrap}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
              <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis
                yAxisId="score"
                domain={[0, 1]}
                stroke="#94a3b8"
                tick={{ fontSize: 12 }}
                tickFormatter={(v: number) => v.toFixed(1)}
              />
              <YAxis
                yAxisId="count"
                orientation="right"
                stroke="#94a3b8"
                tick={{ fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip
                formatter={(value: number, name: string) =>
                  name === 'Требуют внимания' ? value : formatScore(value)
                }
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                yAxisId="score"
                type="monotone"
                dataKey="avgActuality"
                name="Средний Ai"
                stroke={COLOR_AI}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                yAxisId="score"
                type="monotone"
                dataKey="avgRiskScore"
                name="Средний Ri"
                stroke={COLOR_RI}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                yAxisId="count"
                type="monotone"
                dataKey="attentionCount"
                name="Требуют внимания"
                stroke={COLOR_ATTENTION}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
