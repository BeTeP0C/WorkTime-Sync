import { ReactNode } from 'react'

import { AppSidebar } from '@/widgets/AppSidebar'
import { AuthGuard } from '@/widgets/AuthGuard'

import s from './layout.module.scss'

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <AuthGuard mode="protected">
      <div className={s.layout}>
        <AppSidebar />
        <main className={s.main}>
          <div className={s.container}>{children}</div>
        </main>
      </div>
    </AuthGuard>
  )
}
