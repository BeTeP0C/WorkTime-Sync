import { ReactNode } from 'react'

import { MANAGEMENT_ROLES } from '@/entities/auth/model/types'
import { AuthGuard } from '@/widgets/AuthGuard'

interface CreateTeamLayoutProps {
  children: ReactNode
}

export default function CreateTeamLayout({ children }: CreateTeamLayoutProps) {
  return (
    <AuthGuard mode="protected" requireRoles={MANAGEMENT_ROLES}>
      {children}
    </AuthGuard>
  )
}
