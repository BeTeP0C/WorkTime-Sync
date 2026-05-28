import Link from 'next/link'
import { ReactNode } from 'react'
import cn from 'classnames'

import { Button } from '@/shared/ui/Button'

import s from './ErrorScreen.module.scss'

export type ErrorTone = 'neutral' | 'info' | 'warning' | 'critical'
export type ErrorScreenVariant = 'standalone' | 'inline'

export interface ErrorAction {
  label: string
  onClick?: () => void
  href?: string
  variant?: 'primary' | 'ghost'
  icon?: ReactNode
}

export interface ErrorScreenProps {
  code?: string
  title: string
  description?: ReactNode
  icon: ReactNode
  iconTone?: ErrorTone
  primaryAction?: ErrorAction
  secondaryAction?: ErrorAction
  variant?: ErrorScreenVariant
}

function renderAction(action: ErrorAction, fallbackVariant: 'primary' | 'ghost') {
  const variant = action.variant ?? fallbackVariant

  if (action.href) {
    return (
      <Link href={action.href} className={s.actionLink} data-variant={variant}>
        {action.icon && <span className={s.actionIcon}>{action.icon}</span>}
        <span>{action.label}</span>
      </Link>
    )
  }

  return (
    <Button variant={variant} size="lg" leftIcon={action.icon} onClick={action.onClick}>
      {action.label}
    </Button>
  )
}

export function ErrorScreen({
  code,
  title,
  description,
  icon,
  iconTone = 'neutral',
  primaryAction,
  secondaryAction,
  variant = 'inline',
}: ErrorScreenProps) {
  return (
    <section className={cn(s.root, s[`variant_${variant}`])}>
      <div className={s.inner}>
        <div className={cn(s.iconBadge, s[`tone_${iconTone}`])}>{icon}</div>
        {code && <div className={s.code}>{code}</div>}
        <h1 className={s.title}>{title}</h1>
        {description && <p className={s.description}>{description}</p>}
        {(primaryAction || secondaryAction) && (
          <div className={s.actions}>
            {primaryAction && renderAction(primaryAction, 'primary')}
            {secondaryAction && renderAction(secondaryAction, 'ghost')}
          </div>
        )}
      </div>
    </section>
  )
}
