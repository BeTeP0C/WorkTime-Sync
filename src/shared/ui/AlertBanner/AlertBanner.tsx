import { ReactNode } from 'react'
import cn from 'classnames'

import s from './AlertBanner.module.scss'

export type AlertBannerTone = 'info' | 'success' | 'warning' | 'error'

export interface AlertBannerProps {
  tone?: AlertBannerTone
  title?: ReactNode
  icon?: ReactNode
  children?: ReactNode
  className?: string
}

export function AlertBanner({ tone = 'info', title, icon, children, className }: AlertBannerProps) {
  return (
    <div className={cn(s.root, s[`tone_${tone}`], className)} role="status">
      {icon && <span className={s.icon}>{icon}</span>}
      <div className={s.body}>
        {title && <div className={s.title}>{title}</div>}
        {children && <div className={s.text}>{children}</div>}
      </div>
    </div>
  )
}
