'use client'

import { useRouter } from 'next/navigation'
import { ReactNode, useEffect } from 'react'
import { observer } from 'mobx-react-lite'

import { useAuthStore } from '@/app-store/context'
import { isManagementRole } from '@/entities/auth/model/types'
import { LogoIcon } from '@/shared/icons'

import s from './AuthGuard.module.scss'

interface SelfOrHrGuardProps {
  employeeId: string
  children: ReactNode
}

/**
 * Пропускает HR/менеджмент-роли к любому employeeId, обычного сотрудника —
 * только к собственному профилю. Сверху уже стоит mode="protected" AuthGuard
 * на (main)/layout — здесь обрабатываем только ролевое разграничение.
 */
export const SelfOrHrGuard = observer(function SelfOrHrGuard({
  employeeId,
  children,
}: SelfOrHrGuardProps) {
  const auth = useAuthStore()
  const router = useRouter()
  const user = auth.currentUser.value
  const isHr = isManagementRole(user?.role)
  const isSelf = user?.id === employeeId
  const isAllowed = !user ? null : isHr || isSelf

  useEffect(() => {
    if (!auth.isHydrated) return
    if (isAllowed === false) {
      router.replace('/dashboard')
    }
  }, [auth.isHydrated, isAllowed, router])

  if (!auth.isHydrated || isAllowed === null) {
    return (
      <div className={s.splash} aria-busy="true" aria-label="Загрузка">
        <LogoIcon className={s.splashLogo} />
      </div>
    )
  }

  if (!isAllowed) {
    return (
      <div className={s.splash} aria-busy="true" aria-label="Перенаправление">
        <LogoIcon className={s.splashLogo} />
      </div>
    )
  }

  return <>{children}</>
})
