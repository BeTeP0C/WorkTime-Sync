import { ReactNode } from 'react'

import { AngleRightIcon } from '@/shared/icons'

import s from './AppHeader.module.scss'

interface AppHeaderProps {
  title: ReactNode
  breadcrumb?: ReactNode
  action?: ReactNode
}

export function AppHeader({ title, breadcrumb, action }: AppHeaderProps) {
  return (
    <header className={s.header}>
      <div className={s.titleBlock}>
        {breadcrumb && (
          <>
            <div className={s.breadcrumb}>{breadcrumb}</div>
            <AngleRightIcon className={s.breadcrumbArrow} />
          </>
        )}
        <h1 className={s.title}>{title}</h1>
      </div>
      {action && <div className={s.action}>{action}</div>}
    </header>
  )
}
