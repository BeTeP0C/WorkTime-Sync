import { ReactNode } from 'react'
import cn from 'classnames'

import { ArrowSmallUpIcon } from '@/shared/icons'
import { Card } from '@/shared/ui/Card'

import s from './StatCard.module.scss'

interface StatCardProps {
  icon: ReactNode
  label: string
  value: ReactNode
  hint?: ReactNode
  trend?: { value: string; tone: 'up' | 'down' | 'neutral' }
  tone?: 'default' | 'warning' | 'critical' | 'success'
  showTrendIcon?: boolean
  className?: string
  /** Точный цвет значения — переопределяет tone */
  valueColor?: string
}

export function StatCard({
  icon,
  label,
  value,
  hint,
  trend,
  tone = 'default',
  showTrendIcon = true,
  className,
  valueColor,
}: StatCardProps) {
  return (
    <Card padding="lg" className={cn(s.card, s[`tone_${tone}`], className)}>
      <div className={s.head}>
        {icon && <span className={s.icon}>{icon}</span>}
        <span className={s.label}>{label}</span>
      </div>
      <div className={s.value} style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </div>
      {(hint || trend) && (
        <div className={s.footer}>
          {trend && (
            <span className={cn(s.trend, s[`trend_${trend.tone}`])}>
              {showTrendIcon && <ArrowSmallUpIcon className={s.trendIcon} />}
              {trend.value}
            </span>
          )}
          {hint && <span className={s.hint}>{hint}</span>}
        </div>
      )}
    </Card>
  )
}
