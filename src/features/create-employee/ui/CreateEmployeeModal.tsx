'use client'

import { useState } from 'react'

import { createEmployee, CreateEmployeePayload } from '@/entities/employee/api'
import {
  EmployeeRole,
  ROLE_LABEL_RU,
  WORK_FORMAT_LABEL_RU,
  WorkFormat,
} from '@/entities/employee/model/types'
import { XSmallIcon } from '@/shared/icons'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Modal } from '@/shared/ui/Modal'
import { Select, SelectOption } from '@/shared/ui/Select'

import s from './CreateEmployeeModal.module.scss'

const ROLE_OPTIONS: SelectOption<EmployeeRole>[] = (
  ['employee', 'pm', 'manager', 'hr', 'analyst', 'admin'] as const
).map((role) => ({ value: role, label: ROLE_LABEL_RU[role] }))

const WORK_FORMAT_OPTIONS: SelectOption<WorkFormat>[] = (
  ['office', 'remote', 'hybrid'] as const
).map((format) => ({ value: format, label: WORK_FORMAT_LABEL_RU[format] }))

const TIMEZONE_OPTIONS: SelectOption<string>[] = [
  { value: 'Europe/Moscow', label: 'UTC+3 Москва' },
  { value: 'Europe/Kaliningrad', label: 'UTC+2 Калининград' },
  { value: 'Europe/Samara', label: 'UTC+4 Самара' },
  { value: 'Asia/Yekaterinburg', label: 'UTC+5 Екатеринбург' },
  { value: 'Asia/Omsk', label: 'UTC+6 Омск' },
  { value: 'Asia/Krasnoyarsk', label: 'UTC+7 Красноярск' },
  { value: 'Asia/Irkutsk', label: 'UTC+8 Иркутск' },
  { value: 'Asia/Vladivostok', label: 'UTC+10 Владивосток' },
  { value: 'Asia/Magadan', label: 'UTC+11 Магадан' },
  { value: 'Asia/Kamchatka', label: 'UTC+12 Камчатка' },
]

interface CreateEmployeeModalProps {
  open: boolean
  onClose: () => void
  onCreated?: () => void
}

export function CreateEmployeeModal({ open, onClose, onCreated }: CreateEmployeeModalProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [position, setPosition] = useState('')
  const [role, setRole] = useState<EmployeeRole>('employee')
  const [timezone, setTimezone] = useState<string>('Europe/Moscow')
  const [workFormat, setWorkFormat] = useState<WorkFormat>('office')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = (): void => {
    if (isSubmitting) return
    onClose()
  }

  const resetForm = (): void => {
    setFullName('')
    setEmail('')
    setPosition('')
    setRole('employee')
    setTimezone('Europe/Moscow')
    setWorkFormat('office')
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!fullName.trim()) {
      setError('Укажите ФИО сотрудника')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      const payload: CreateEmployeePayload = {
        fullName: fullName.trim(),
        email: email.trim() || null,
        position: position.trim() || null,
        role,
        timezone,
        workFormat,
      }
      await createEmployee(payload)
      resetForm()
      onCreated?.()
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось создать сотрудника'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} labelledBy="create-employee-title" size="md">
      <form className={s.form} onSubmit={handleSubmit}>
        <div className={s.header}>
          <h2 id="create-employee-title" className={s.title}>
            Добавить сотрудника
          </h2>
          <button
            type="button"
            className={s.close}
            onClick={handleClose}
            aria-label="Закрыть"
            disabled={isSubmitting}
          >
            <XSmallIcon width={16} height={16} />
          </button>
        </div>

        <div className={s.body}>
          <Input
            label="ФИО"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Иванов Иван Иванович"
            fullWidth
            required
            disabled={isSubmitting}
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ivanov@company.ru"
            fullWidth
            disabled={isSubmitting}
          />
          <Input
            label="Должность"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="Frontend-разработчик"
            fullWidth
            disabled={isSubmitting}
          />

          <div className={s.field}>
            <label className={s.label}>Роль</label>
            <Select<EmployeeRole>
              value={role}
              onValueChange={(v) => v && setRole(v as EmployeeRole)}
              options={ROLE_OPTIONS}
              placeholder=""
              disabled={isSubmitting}
            />
          </div>

          <div className={s.field}>
            <label className={s.label}>Часовой пояс</label>
            <Select<string>
              value={timezone}
              onValueChange={(v) => v && setTimezone(v)}
              options={TIMEZONE_OPTIONS}
              placeholder=""
              disabled={isSubmitting}
            />
          </div>

          <div className={s.field}>
            <label className={s.label}>Формат работы</label>
            <Select<WorkFormat>
              value={workFormat}
              onValueChange={(v) => v && setWorkFormat(v as WorkFormat)}
              options={WORK_FORMAT_OPTIONS}
              placeholder=""
              disabled={isSubmitting}
            />
          </div>

          {error && <div className={s.error}>{error}</div>}
        </div>

        <div className={s.footer}>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
            {isSubmitting ? 'Создание…' : 'Создать сотрудника'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
