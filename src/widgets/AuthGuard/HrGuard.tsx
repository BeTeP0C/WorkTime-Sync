'use client'

import { ReactNode } from 'react'

import { MANAGEMENT_ROLES } from '@/entities/auth/model/types'

import { AuthGuard } from './AuthGuard'

interface HrGuardProps {
  children: ReactNode
}

export function HrGuard({ children }: HrGuardProps) {
  return (
    <AuthGuard mode="protected" requireRoles={MANAGEMENT_ROLES}>
      {children}
    </AuthGuard>
  )
}
