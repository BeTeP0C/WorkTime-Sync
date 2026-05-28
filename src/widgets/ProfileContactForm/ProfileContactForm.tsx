'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { UpdateEmployeePayload } from '@/entities/employee/api'
import { Employee } from '@/entities/employee/model/types'
import { Button } from '@/shared/ui/Button'
import { Card, CardHeader } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'

import s from './ProfileContactForm.module.scss'

interface ProfileContactFormProps {
  employee: Employee
  teamName: string | null
  isSubmitting: boolean
  error: string | null
  onSubmit: (payload: UpdateEmployeePayload) => Promise<boolean>
}

interface FormValues {
  firstName: string
  lastName: string
  email: string
  position: string
  hireDate: string
}

function buildDefaults(employee: Employee): FormValues {
  return {
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email ?? '',
    position: employee.position,
    hireDate: employee.hireDate ?? '',
  }
}

export function ProfileContactForm({
  employee,
  teamName,
  isSubmitting,
  error,
  onSubmit,
}: ProfileContactFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty, errors },
  } = useForm<FormValues>({
    defaultValues: buildDefaults(employee),
  })

  // Когда employee обновляется снаружи (после успешного PATCH), пересинхронизируем дефолты.
  useEffect(() => {
    reset(buildDefaults(employee))
  }, [employee, reset])

  const submit = handleSubmit(async (values) => {
    const payload: UpdateEmployeePayload = {}
    const nextFullName = `${values.firstName.trim()} ${values.lastName.trim()}`.trim()
    if (nextFullName && nextFullName !== employee.fullName) {
      payload.fullName = nextFullName
    }
    const nextEmail = values.email.trim() === '' ? null : values.email.trim()
    if (nextEmail !== (employee.email ?? null)) {
      payload.email = nextEmail
    }
    const nextPosition = values.position.trim()
    if (nextPosition !== employee.position) {
      payload.position = nextPosition === '' ? null : nextPosition
    }
    const nextHireDate = values.hireDate === '' ? null : values.hireDate
    if (nextHireDate !== (employee.hireDate ?? null)) {
      payload.hireDate = nextHireDate
    }
    if (Object.keys(payload).length === 0) {
      toast.info('Нет изменений для сохранения')
      return
    }
    const ok = await onSubmit(payload)
    if (ok) toast.success('Контактные данные сохранены')
  })

  return (
    <Card padding="lg" className={s.card}>
      <CardHeader title="Контактные данные" />
      <form onSubmit={submit} className={s.card} noValidate>
        <div className={s.grid}>
          <Input
            label="Имя"
            fullWidth
            {...register('firstName', { required: 'Укажите имя' })}
            error={errors.firstName?.message}
          />
          <Input
            label="Фамилия"
            fullWidth
            {...register('lastName', { required: 'Укажите фамилию' })}
            error={errors.lastName?.message}
          />
          <Input
            label="Email"
            type="email"
            fullWidth
            {...register('email', {
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Некорректный email',
              },
            })}
            error={errors.email?.message}
          />
          <Input label="Должность" fullWidth {...register('position')} />
          <div className={s.readonlyField}>
            <span className={s.readonlyLabel}>Команда</span>
            <span className={s.readonlyValue}>{teamName ?? 'Без команды'}</span>
          </div>
          <Input label="Дата приёма" type="date" fullWidth {...register('hireDate')} />
        </div>

        {error && <div className={s.formError}>{error}</div>}

        <div className={s.actions}>
          <Button
            variant="secondary"
            size="md"
            type="button"
            disabled={!isDirty || isSubmitting}
            onClick={() => reset(buildDefaults(employee))}
          >
            Отмена
          </Button>
          <Button variant="primary" size="md" type="submit" disabled={!isDirty || isSubmitting}>
            {isSubmitting ? 'Сохраняем…' : 'Сохранить'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
