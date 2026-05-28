'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { toast } from 'sonner'

import { useAuthStore } from '@/app-store/context'
import { consumeState } from '@/features/auth/vk-oauth/state'
import { ApiError } from '@/shared/api/client'
import { Card } from '@/shared/ui/Card'

import s from './VkCallbackClient.module.scss'

type Status = 'pending' | 'error'

export const VkCallbackClient = observer(function VkCallbackClient() {
  const auth = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<Status>('pending')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const failWith = (message: string) => {
      setErrorMessage(message)
      setStatus('error')
      toast.error(message)
    }

    const vkError = searchParams.get('error')
    if (vkError) {
      const description = searchParams.get('error_description') ?? vkError
      failWith(`VK вернул ошибку: ${description}`)
      return
    }

    const code = searchParams.get('code')
    const state = searchParams.get('state')
    if (!code || !state) {
      failWith('Ответ VK не содержит code или state.')
      return
    }

    const expectedState = consumeState()
    if (!expectedState || expectedState !== state) {
      failWith('Не удалось подтвердить сессию входа (CSRF state не совпал). Попробуйте ещё раз.')
      return
    }

    void (async () => {
      try {
        await auth.loginWithVk(code)
        toast.success('Вход через VK выполнен')
        router.replace('/dashboard')
      } catch (error) {
        const msg =
          error instanceof ApiError
            ? error.detail
            : 'Не удалось завершить вход через VK. Попробуйте ещё раз.'
        failWith(msg)
      }
    })()
  }, [auth, router, searchParams])

  return (
    <Card padding="lg" className={s.card}>
      {status === 'pending' ? (
        <>
          <h1 className={s.title}>Завершаем вход через VK…</h1>
          <p className={s.body}>Это займёт пару секунд.</p>
        </>
      ) : (
        <>
          <h1 className={s.title}>Не удалось войти</h1>
          <p className={s.error}>{errorMessage}</p>
          <p className={s.body}>
            <Link href="/auth/login" className={s.link}>
              Вернуться к входу
            </Link>
          </p>
        </>
      )}
    </Card>
  )
})
