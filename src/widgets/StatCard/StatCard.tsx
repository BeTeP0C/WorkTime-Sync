import { ReactNode } from 'react'
import cn from 'classnames'

import { Card } from '@/shared/ui/Card'

import s from './StatCard.module.scss'

interface StatCardProps {
  icon: ReactNode
  label: string
  value: ReactNode
  hint?: ReactNode
  trend?: { value: string; tone: 'up' | 'down' | 'neutral' }
  tone?: 'default' | 'warning' | 'critical' | 'success'
}

export function StatCard({ icon, label, value, hint, trend, tone = 'default' }: StatCardProps) {
  return (
    <Card padding="lg" className={cn(s.card, s[`tone_${tone}`])}>
      <div className={s.head}>
        <span className={s.icon}>{icon}</span>
        <span className={s.label}>{label}</span>
      </div>
      <div className={s.value}>{value}</div>
      {(hint || trend) && (
        <div className={s.footer}>
          {trend && (
            <span className={cn(s.trend, s[`trend_${trend.tone}`])}>
              {trend.tone === 'up' ? '↑' : trend.tone === 'down' ? '↓' : '·'} {trend.value}
            </span>
          )}
          {hint && <span className={s.hint}>{hint}</span>}
        </div>
      )}
    </Card>
  )
}
