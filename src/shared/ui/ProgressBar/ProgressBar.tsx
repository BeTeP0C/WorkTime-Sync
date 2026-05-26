import cn from 'classnames'

import s from './ProgressBar.module.scss'

export type ProgressTone = 'primary' | 'success' | 'warning' | 'critical' | 'high' | 'medium'

interface ProgressBarProps {
  /** value 0..1 (clamped). Если max задан — value / max */
  value: number
  max?: number
  tone?: ProgressTone
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ProgressBar({
  value,
  max = 1,
  tone = 'primary',
  size = 'md',
  className,
}: ProgressBarProps) {
  const ratio = Math.max(0, Math.min(1, value / max))
  const percent = Math.round(ratio * 100)

  return (
    <div className={cn(s.bar, s[`size_${size}`], className)} aria-valuenow={percent}>
      <div className={cn(s.fill, s[`tone_${tone}`])} style={{ width: `${percent}%` }} />
    </div>
  )
}
