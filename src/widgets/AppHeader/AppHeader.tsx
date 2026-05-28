import { ReactNode } from 'react'

import { AngleRightIcon } from '@/shared/icons'
import { NotificationsBell } from '@/widgets/NotificationsBell'

import s from './AppHeader.module.scss'

interface AppHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  breadcrumb?: ReactNode
  action?: ReactNode
}

export function AppHeader({ title, subtitle, breadcrumb, action }: AppHeaderProps) {
  return (
    <header className={s.header}>
      <div className={s.titleBlock}>
        {breadcrumb && (
          <>
            <div className={s.breadcrumb}>{breadcrumb}</div>
            <AngleRightIcon className={s.breadcrumbArrow} />
          </>
        )}
        <div className={s.titleColumn}>
          <h1 className={s.title}>{title}</h1>
          {subtitle && <div className={s.subtitle}>{subtitle}</div>}
        </div>
      </div>
      <div className={s.action}>
        {action}
        <NotificationsBell />
      </div>
    </header>
  )
}
