'use client'

import { ReactNode } from 'react'

import { HR_NAV_ROLES } from '@/entities/auth/model/types'

import { AuthGuard } from './AuthGuard'

interface HrOrAnalystGuardProps {
  children: ReactNode
}

/**
 * Read-only HR-зона: пропускает management-роли и аналитика. Используется на
 * экранах диагностики, метрик, конфликтов, roadmap и списка сотрудников —
 * там, где аналитик должен видеть сводки, но не выполнять управленческих
 * действий. Для management-only (создание/загрузка/удаление) используется
 * строгий `HrGuard`.
 */
export function HrOrAnalystGuard({ children }: HrOrAnalystGuardProps) {
  return (
    <AuthGuard mode="protected" requireRoles={HR_NAV_ROLES}>
      {children}
    </AuthGuard>
  )
}
