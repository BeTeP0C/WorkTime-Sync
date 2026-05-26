import { HTMLAttributes, ReactNode } from 'react'
import cn from 'classnames'

import s from './Badge.module.scss'

export type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'info'

export type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  size?: BadgeSize
  pill?: boolean
  children: ReactNode
  dot?: boolean
}

export function Badge({
  tone = 'neutral',
  size = 'md',
  pill = false,
  dot = false,
  children,
  className,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(s.badge, s[`tone_${tone}`], s[`size_${size}`], pill && s.pill, className)}
      {...rest}
    >
      {dot && <span className={s.dot} />}
      {children}
    </span>
  )
}
