'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { observer } from 'mobx-react-lite'
import { toast } from 'sonner'

import { useAuthStore } from '@/app-store/context'
import { startVkLogin } from '@/entities/auth/api'
import { appendStateToUrl, generateState, storeState } from '@/features/auth/vk-oauth/state'
import { ApiError } from '@/shared/api/client'
import { VkIcon } from '@/shared/icons/VkIcon'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'

import s from './LoginClient.module.scss'

interface LoginFormValues {
  email: string
  password: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const LoginClient = observer(function LoginClient() {
  const auth = useAuthStore()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [vkError, setVkError] = useState<string | null>(null)
  const [isVkLoading, setIsVkLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    mode: 'onBlur',
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setSubmitError(null)
    try {
      await auth.login(data)
      toast.success('Добро пожаловать!')
      router.replace('/dashboard')
    } catch (error) {
      const msg = error instanceof ApiError ? error.detail : 'Не удалось войти. Попробуйте ещё раз.'
      setSubmitError(msg)
      toast.error(msg)
    }
  }

  const onVkLogin = async () => {
    setVkError(null)
    setIsVkLoading(true)
    try {
      const { authorization_url } = await startVkLogin()
      const state = generateState()
      storeState(state)
      window.location.assign(appendStateToUrl(authorization_url, state))
    } catch (error) {
      setIsVkLoading(false)
      const msg =
        error instanceof ApiError
          ? error.detail
          : 'Не удалось начать вход через VK. Попробуйте ещё раз.'
      setVkError(msg)
      toast.error(msg)
    }
  }

  return (
    <Card padding="lg" className={s.card}>
      <div className={s.header}>
        <h1 className={s.title}>Вход в аккаунт</h1>
        <p className={s.subtitle}>Введите email и пароль, чтобы продолжить</p>
      </div>

      <form className={s.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Email"
          type="email"
          size="lg"
          fullWidth
          autoComplete="email"
          placeholder="you@company.com"
          error={errors.email?.message}
          {...register('email', {
            required: 'Введите email',
            pattern: { value: EMAIL_RE, message: 'Некорректный email' },
          })}
        />

        <Input
          label="Пароль"
          type={showPassword ? 'text' : 'password'}
          size="lg"
          fullWidth
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          rightSlot={
            <button
              type="button"
              className={s.eyeBtn}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
            >
              {showPassword ? 'Скрыть' : 'Показать'}
            </button>
          }
          {...register('password', {
            required: 'Введите пароль',
            minLength: { value: 6, message: 'Минимум 6 символов' },
          })}
        />

        {submitError && <div className={s.formError}>{submitError}</div>}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={isSubmitting}
          className={s.submit}
        >
          {isSubmitting ? 'Входим…' : 'Войти'}
        </Button>
      </form>

      <div className={s.divider}>или</div>

      <div className={s.oauthBlock}>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          fullWidth
          leftIcon={<VkIcon />}
          disabled={isVkLoading}
          onClick={onVkLogin}
        >
          {isVkLoading ? 'Открываем VK…' : 'Войти через VK ID'}
        </Button>
        {vkError && <div className={s.formError}>{vkError}</div>}
      </div>

      <div className={s.footer}>
        <span className={s.footerText}>Нет аккаунта?</span>{' '}
        <Link href="/auth/register" className={s.link}>
          Создать аккаунт →
        </Link>
      </div>

      <div className={s.demo}>
        <span className={s.demoLabel}>Demo</span>
        <code className={s.demoValue}>test@example.com / pass1234</code>
      </div>
    </Card>
  )
})
