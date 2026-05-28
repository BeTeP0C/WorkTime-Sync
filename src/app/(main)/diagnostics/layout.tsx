import { ReactNode } from 'react'

import { HR_NAV_ROLES } from '@/entities/auth/model/types'
import { AuthGuard } from '@/widgets/AuthGuard'

interface DiagnosticsLayoutProps {
  children: ReactNode
}

export default function DiagnosticsLayout({ children }: DiagnosticsLayoutProps) {
  return (
    <AuthGuard mode="protected" requireRoles={HR_NAV_ROLES}>
      {children}
    </AuthGuard>
  )
}
