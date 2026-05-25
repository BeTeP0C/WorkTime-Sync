import { HTMLAttributes, ReactNode } from 'react'
import cn from 'classnames'

import s from './Card.module.scss'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

export function Card({ children, className, padding = 'md', hover, ...rest }: CardProps) {
  return (
    <div className={cn(s.card, s[`padding_${padding}`], hover && s.hover, className)} {...rest}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: ReactNode
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export function CardHeader({ title, icon, action, className }: CardHeaderProps) {
  return (
    <div className={cn(s.header, className)}>
      <div className={s.headerTitle}>
        {icon && <span className={s.headerIcon}>{icon}</span>}
        <span>{title}</span>
      </div>
      {action && <div className={s.headerAction}>{action}</div>}
    </div>
  )
}
