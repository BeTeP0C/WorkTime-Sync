'use client'

import { useRouter } from 'next/navigation'
import { ReactNode, useEffect } from 'react'
import { observer } from 'mobx-react-lite'

import { useAuthStore } from '@/app-store/context'
import { UserRole } from '@/entities/auth/model/types'
import { LogoIcon } from '@/shared/icons'

import s from './AuthGuard.module.scss'

export type AuthGuardMode = 'protected' | 'guest'

interface AuthGuardProps {
  mode: AuthGuardMode
  children: ReactNode
  requireRoles?: ReadonlySet<UserRole>
}

export const AuthGuard = observer(function AuthGuard({
  mode,
  children,
  requireRoles,
}: AuthGuardProps) {
  const auth = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!auth.isHydrated && !auth.hydrationStage.isLoading) {
      void auth.hydrate()
    }
  }, [auth])

  const role = auth.currentUser.value?.role
  const isRoleDenied =
    mode === 'protected' &&
    auth.isAuthenticated &&
    requireRoles !== undefined &&
    (!role || !requireRoles.has(role))

  useEffect(() => {
    if (!auth.isHydrated) return
    if (mode === 'protected' && !auth.isAuthenticated) {
      router.replace('/auth/login')
    } else if (mode === 'guest' && auth.isAuthenticated) {
      router.replace('/dashboard')
    } else if (isRoleDenied) {
      router.replace('/dashboard')
    }
  }, [auth.isHydrated, auth.isAuthenticated, isRoleDenied, mode, router])

  if (!auth.isHydrated) {
    return (
      <div className={s.splash} aria-busy="true" aria-label="Загрузка">
        <LogoIcon className={s.splashLogo} />
      </div>
    )
  }

  if (mode === 'protected' && !auth.isAuthenticated) {
    return (
      <div className={s.splash} aria-busy="true" aria-label="Перенаправление">
        <LogoIcon className={s.splashLogo} />
      </div>
    )
  }

  if (mode === 'guest' && auth.isAuthenticated) {
    return (
      <div className={s.splash} aria-busy="true" aria-label="Перенаправление">
        <LogoIcon className={s.splashLogo} />
      </div>
    )
  }

  if (isRoleDenied) {
    return (
      <div className={s.splash} aria-busy="true" aria-label="Перенаправление">
        <LogoIcon className={s.splashLogo} />
      </div>
    )
  }

  return <>{children}</>
})
