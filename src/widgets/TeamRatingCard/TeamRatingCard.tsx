'use client'

import { TeamRatingItem } from '@/entities/analytics/model/types'
import { ChartTreeIcon, DownloadIcon } from '@/shared/icons'
import { exportCsv } from '@/shared/lib/exportCsv'
import { formatScore } from '@/shared/lib/format'
import { Card } from '@/shared/ui/Card'

import s from './TeamRatingCard.module.scss'

interface TeamRatingCardProps {
  items: TeamRatingItem[]
}

export function TeamRatingCard({ items }: TeamRatingCardProps) {
  const handleExport = () => {
    const rows = items.map((item, index) => ({
      '#': index + 1,
      Команда: item.name,
      Размер: item.membersCount,
      'Средний Ai': formatScore(item.avgActuality),
      'Средний Ri': formatScore(item.avgRiskScore),
      'Требуют внимания': item.attentionCount,
    }))
    exportCsv('team-rating.csv', rows)
  }

  return (
    <Card padding="lg" className={s.card}>
      <header className={s.header}>
        <div className={s.title}>
          <ChartTreeIcon width={20} height={20} />
          <span>Рейтинг команд по актуальности</span>
        </div>
        <button
          type="button"
          className={s.exportBtn}
          onClick={handleExport}
          disabled={items.length === 0}
        >
          <DownloadIcon width={16} height={16} />
          <span>Экспорт CSV</span>
        </button>
      </header>

      {items.length === 0 ? (
        <div className={s.empty}>Нет данных по командам</div>
      ) : (
        <table className={s.table}>
          <thead>
            <tr>
              <th className={s.colRank}>#</th>
              <th>Команда</th>
              <th className={s.colNum}>Состав</th>
              <th className={s.colNum}>Ai</th>
              <th className={s.colNum}>Ri</th>
              <th className={s.colNum}>Внимание</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.teamId}>
                <td className={s.colRank}>{index + 1}</td>
                <td className={s.colName}>{item.name}</td>
                <td className={s.colNum}>{item.membersCount}</td>
                <td className={s.colNum}>
                  <span className={getAiClass(item.avgActuality, s)}>
                    {formatScore(item.avgActuality)}
                  </span>
                </td>
                <td className={s.colNum}>
                  <span className={getRiClass(item.avgRiskScore, s)}>
                    {formatScore(item.avgRiskScore)}
                  </span>
                </td>
                <td className={s.colNum}>
                  {item.attentionCount > 0 ? (
                    <span className={s.attentionBadge}>{item.attentionCount}</span>
                  ) : (
                    <span className={s.colMuted}>0</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}

function getAiClass(value: number, styles: Record<string, string>): string {
  if (value >= 0.7) return styles.tagGood
  if (value >= 0.4) return styles.tagWarn
  return styles.tagDanger
}

function getRiClass(value: number, styles: Record<string, string>): string {
  if (value >= 0.7) return styles.tagDanger
  if (value >= 0.4) return styles.tagWarn
  return styles.tagGood
}
