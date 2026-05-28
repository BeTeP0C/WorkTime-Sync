'use client'

import {
  EmployeeRole,
  EMPLOYMENT_TYPE_LABEL_RU,
  EmploymentType,
  ROLE_LABEL_RU,
} from '@/entities/employee/model/types'
import { Input } from '@/shared/ui/Input'
import { Select, SelectOption } from '@/shared/ui/Select'

import s from './PersonalDataStep.module.scss'

const ROLE_OPTIONS: SelectOption<EmployeeRole>[] = (
  ['employee', 'pm', 'manager', 'hr', 'analyst', 'admin'] as const
).map((role) => ({ value: role, label: ROLE_LABEL_RU[role] }))

const EMPLOYMENT_OPTIONS: SelectOption<EmploymentType>[] = (
  ['full_time', 'part_time', 'contract'] as const
).map((value) => ({ value, label: EMPLOYMENT_TYPE_LABEL_RU[value] }))

export interface PersonalDataValues {
  fullName: string
  email: string
  position: string
  role: EmployeeRole
  vkUserId: string
  employmentType: EmploymentType
}

export interface PersonalDataFieldErrors {
  fullName?: string | null
  email?: string | null
  vkUserId?: string | null
}

interface PersonalDataStepProps {
  values: PersonalDataValues
  onChange: (patch: Partial<PersonalDataValues>) => void
  errors?: PersonalDataFieldErrors
  disabled?: boolean
}

export function PersonalDataStep({ values, onChange, errors, disabled }: PersonalDataStepProps) {
  return (
    <div className={s.root}>
      <div className={s.grid}>
        <label className={s.field}>
          <span className={s.fieldLabel}>ФИО *</span>
          <Input
            size="md"
            value={values.fullName}
            placeholder="Иванов Иван Иванович"
            onChange={(e) => onChange({ fullName: e.target.value })}
            fullWidth
            disabled={disabled}
          />
          {errors?.fullName && <span className={s.fieldError}>{errors.fullName}</span>}
        </label>

        <label className={s.field}>
          <span className={s.fieldLabel}>Email</span>
          <Input
            size="md"
            type="email"
            value={values.email}
            placeholder="ivanov@company.ru"
            onChange={(e) => onChange({ email: e.target.value })}
            fullWidth
            disabled={disabled}
          />
          {errors?.email && <span className={s.fieldError}>{errors.email}</span>}
        </label>

        <label className={s.field}>
          <span className={s.fieldLabel}>Должность</span>
          <Input
            size="md"
            value={values.position}
            placeholder="Frontend-разработчик"
            onChange={(e) => onChange({ position: e.target.value })}
            fullWidth
            disabled={disabled}
          />
        </label>

        <label className={s.field}>
          <span className={s.fieldLabel}>Роль в системе *</span>
          <Select<EmployeeRole>
            value={values.role}
            onValueChange={(v) => v && onChange({ role: v as EmployeeRole })}
            options={ROLE_OPTIONS}
            placeholder=""
            disabled={disabled}
          />
        </label>

        <label className={s.field}>
          <span className={s.fieldLabel}>Тип занятости *</span>
          <Select<EmploymentType>
            value={values.employmentType}
            onValueChange={(v) => v && onChange({ employmentType: v as EmploymentType })}
            options={EMPLOYMENT_OPTIONS}
            placeholder=""
            disabled={disabled}
          />
        </label>

        <label className={s.field}>
          <span className={s.fieldLabel}>VK ID</span>
          <Input
            size="md"
            value={values.vkUserId}
            placeholder="123456789"
            onChange={(e) => onChange({ vkUserId: e.target.value })}
            fullWidth
            disabled={disabled}
          />
          {errors?.vkUserId && <span className={s.fieldError}>{errors.vkUserId}</span>}
        </label>
      </div>
    </div>
  )
}
