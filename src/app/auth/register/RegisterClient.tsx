'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { observer } from 'mobx-react-lite'

import { useAuthStore } from '@/app-store/context'
import { ApiError } from '@/shared/api/client'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'

import s from './RegisterClient.module.scss'

interface RegisterFormValues {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const RegisterClient = observer(function RegisterClient() {
  const auth = useAuthStore()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    mode: 'onBlur',
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  })

  const password = watch('password')

  const onSubmit = async (data: RegisterFormValues) => {
    setSubmitError(null)
    try {
      await auth.register({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
      })
      router.replace('/dashboard')
    } catch (error) {
      const msg =
        error instanceof ApiError
          ? error.message
          : 'Не удалось создать аккаунт. Попробуйте ещё раз.'
      setSubmitError(msg)
    }
  }

  return (
    <Card padding="lg" className={s.card}>
      <div className={s.header}>
        <h1 className={s.title}>Создание аккаунта</h1>
        <p className={s.subtitle}>Заполните форму, чтобы начать пользоваться WorkTime Sync</p>
      </div>

      <form className={s.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Имя и фамилия"
          type="text"
          size="lg"
          fullWidth
          autoComplete="name"
          placeholder="Алексей Иванов"
          error={errors.fullName?.message}
          {...register('fullName', {
            required: 'Введите имя',
            minLength: { value: 2, message: 'Минимум 2 символа' },
          })}
        />

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
          autoComplete="new-password"
          placeholder="Минимум 6 символов"
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

        <Input
          label="Подтверждение пароля"
          type={showPassword ? 'text' : 'password'}
          size="lg"
          fullWidth
          autoComplete="new-password"
          placeholder="Повторите пароль"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Повторите пароль',
            validate: (value) => value === password || 'Пароли не совпадают',
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
          {isSubmitting ? 'Создаём…' : 'Создать аккаунт'}
        </Button>
      </form>

      <div className={s.footer}>
        <span className={s.footerText}>Уже есть аккаунт?</span>{' '}
        <Link href="/auth/login" className={s.link}>
          Войти →
        </Link>
      </div>
    </Card>
  )
})
