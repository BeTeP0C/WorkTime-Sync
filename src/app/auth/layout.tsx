import { ReactNode } from 'react'

import { LogoIcon } from '@/shared/icons'
import { AuthGuard } from '@/widgets/AuthGuard'

import s from './layout.module.scss'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <AuthGuard mode="guest">
      <div className={s.root}>
        <div className={s.brand}>
          <LogoIcon className={s.brandIcon} />
          <div className={s.brandText}>
            <span className={s.brandTitle}>WorkTime</span>
            <span className={s.brandSubtitle}>Sync</span>
          </div>
        </div>
        <div className={s.content}>{children}</div>
      </div>
    </AuthGuard>
  )
}
