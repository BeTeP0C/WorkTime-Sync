'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { toast } from 'sonner'

import { useEmployeesStore, useTeamsStore } from '@/app-store/context'
import { EmployeeRole, EmploymentType, WorkFormat } from '@/entities/employee/model/types'
import { TeamRole } from '@/entities/team/model/types'
import { ApiError } from '@/shared/api/client'
import { AngleRightIcon, UndoIcon } from '@/shared/icons'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Step, Stepper } from '@/shared/ui/Stepper'

import {
  PersonalDataFieldErrors,
  PersonalDataStep,
  PersonalDataValues,
} from './components/PersonalDataStep'
import { ReviewStep } from './components/ReviewStep'
import { TeamStep, TeamValues } from './components/TeamStep'
import { WorkScheduleStep, WorkScheduleValues } from './components/WorkScheduleStep'

import s from './CreateEmployeeClient.module.scss'

type StepKey = 'personal' | 'schedule' | 'team' | 'review'

const STEP_ORDER: StepKey[] = ['personal', 'schedule', 'team', 'review']
const STEP_LABELS: Record<StepKey, string> = {
  personal: 'Личные данные',
  schedule: 'Рабочий график',
  team: 'Команда',
  review: 'Подтверждение',
}

const DEFAULT_PERSONAL: PersonalDataValues = {
  fullName: '',
  email: '',
  position: '',
  role: 'employee' as EmployeeRole,
  vkUserId: '',
  employmentType: 'full_time' as EmploymentType,
}

const DEFAULT_SCHEDULE: WorkScheduleValues = {
  workDays: [0, 1, 2, 3, 4],
  startTime: '10:00',
  endTime: '19:00',
  timezone: 'Europe/Moscow',
  workFormat: 'office' as WorkFormat,
}

const DEFAULT_TEAM: TeamValues = {
  teamId: null,
  roleInTeam: 'member' as TeamRole,
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VK_RE = /^\d+$/

export const CreateEmployeeClient = observer(function CreateEmployeeClient() {
  const employeesStore = useEmployeesStore()
  const teamsStore = useTeamsStore()
  const router = useRouter()

  const [step, setStep] = useState<StepKey>('personal')
  const [personal, setPersonal] = useState<PersonalDataValues>(DEFAULT_PERSONAL)
  const [schedule, setSchedule] = useState<WorkScheduleValues>(DEFAULT_SCHEDULE)
  const [team, setTeam] = useState<TeamValues>(DEFAULT_TEAM)

  const [validationError, setValidationError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<PersonalDataFieldErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (teamsStore.list.isEmpty && !teamsStore.list.loadingStage.isLoading) {
      teamsStore.fetch()
    }
  }, [teamsStore])

  const handlePersonalChange = (patch: Partial<PersonalDataValues>) => {
    setPersonal((prev) => ({ ...prev, ...patch }))
    setFieldErrors((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(patch) as Array<keyof PersonalDataValues>) {
        if (key in next) delete next[key as keyof PersonalDataFieldErrors]
      }
      return next
    })
  }

  const handleScheduleChange = (patch: Partial<WorkScheduleValues>) => {
    setSchedule((prev) => ({ ...prev, ...patch }))
    setValidationError(null)
  }

  const handleTeamChange = (patch: Partial<TeamValues>) => {
    setTeam((prev) => ({ ...prev, ...patch }))
    setValidationError(null)
  }

  const validatePersonal = (): string | null => {
    const trimmedName = personal.fullName.trim()
    if (!trimmedName) {
      setFieldErrors({ fullName: 'Укажите ФИО' })
      return 'Заполните обязательные поля'
    }
    if (personal.email.trim() && !EMAIL_RE.test(personal.email.trim())) {
      setFieldErrors({ email: 'Некорректный email' })
      return 'Проверьте email'
    }
    if (personal.vkUserId.trim() && !VK_RE.test(personal.vkUserId.trim())) {
      setFieldErrors({ vkUserId: 'VK ID должен содержать только цифры' })
      return 'Проверьте VK ID'
    }
    setFieldErrors({})
    return null
  }

  const validateSchedule = (): string | null => {
    if (schedule.workDays.length === 0) return 'Выберите хотя бы один рабочий день'
    if (schedule.startTime >= schedule.endTime) {
      return 'Время начала должно быть раньше времени окончания'
    }
    return null
  }

  const handleNext = () => {
    setValidationError(null)
    if (step === 'personal') {
      const err = validatePersonal()
      if (err) {
        setValidationError(err)
        return
      }
      setStep('schedule')
      return
    }
    if (step === 'schedule') {
      const err = validateSchedule()
      if (err) {
        setValidationError(err)
        return
      }
      setStep('team')
      return
    }
    if (step === 'team') {
      setStep('review')
    }
  }

  const handleBack = () => {
    if (step === 'personal') {
      router.push('/employees')
      return
    }
    const currentIndex = STEP_ORDER.indexOf(step)
    setStep(STEP_ORDER[currentIndex - 1])
    setValidationError(null)
    setSubmitError(null)
  }

  const handleStepClick = (index: number) => {
    const target = STEP_ORDER[index]
    if (!target) return
    if (STEP_ORDER.indexOf(target) < STEP_ORDER.indexOf(step)) {
      setStep(target)
      setValidationError(null)
      setSubmitError(null)
    }
  }

  const handleSubmit = async () => {
    setSubmitError(null)
    setFieldErrors({})

    const personalErr = validatePersonal()
    if (personalErr) {
      setStep('personal')
      setValidationError(personalErr)
      return
    }
    const scheduleErr = validateSchedule()
    if (scheduleErr) {
      setStep('schedule')
      setValidationError(scheduleErr)
      return
    }

    setIsSubmitting(true)
    try {
      const employee = await employeesStore.createFull({
        vkUserId: personal.vkUserId.trim() || null,
        role: personal.role,
        fullName: personal.fullName.trim(),
        email: personal.email.trim() || null,
        position: personal.position.trim() || null,
        hireDate: null,
        employmentType: personal.employmentType,
        timezone: schedule.timezone,
        workFormat: schedule.workFormat,
        schedule: {
          workDays: schedule.workDays,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          timezone: schedule.timezone,
        },
        team: team.teamId ? { teamId: team.teamId, roleInTeam: team.roleInTeam } : null,
      })
      toast.success(`Сотрудник «${employee.fullName}» создан`)
      router.push(`/employees/${employee.id}`)
    } catch (error) {
      const detail =
        error instanceof ApiError
          ? error.detail
          : 'Не удалось создать сотрудника. Попробуйте ещё раз.'
      // Подсветка поля с дубликатом — бэк отдаёт generic "...email or VK user id..."
      if (error instanceof ApiError && /email/i.test(detail ?? '')) {
        setFieldErrors({ email: detail })
        setStep('personal')
      } else if (error instanceof ApiError && /vk/i.test(detail ?? '')) {
        setFieldErrors({ vkUserId: detail })
        setStep('personal')
      } else {
        setSubmitError(detail)
      }
      toast.error(detail)
      setIsSubmitting(false)
    }
  }

  const steps: Step[] = STEP_ORDER.map((key) => {
    const currentIndex = STEP_ORDER.indexOf(step)
    const itemIndex = STEP_ORDER.indexOf(key)
    let state: Step['state'] = 'pending'
    if (itemIndex < currentIndex) state = 'done'
    else if (itemIndex === currentIndex) state = 'active'
    return { label: STEP_LABELS[key], state }
  })

  const renderActions = () => {
    if (step === 'review') {
      return (
        <>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            leftIcon={<UndoIcon />}
            onClick={handleBack}
            disabled={isSubmitting}
          >
            Назад
          </Button>
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={s.submit}
          >
            {isSubmitting ? 'Создаём…' : 'Создать сотрудника'}
          </Button>
        </>
      )
    }
    const nextLabelMap: Record<Exclude<StepKey, 'review'>, string> = {
      personal: 'Далее — Рабочий график',
      schedule: 'Далее — Команда',
      team: 'Далее — Подтверждение',
    }
    return (
      <>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          leftIcon={<UndoIcon />}
          onClick={handleBack}
        >
          Назад
        </Button>
        <Button
          type="button"
          variant="primary"
          size="lg"
          rightIcon={<AngleRightIcon />}
          onClick={handleNext}
          className={s.submit}
        >
          {nextLabelMap[step as Exclude<StepKey, 'review'>]}
        </Button>
      </>
    )
  }

  const cardSubtitleMap: Record<StepKey, string> = {
    personal: 'Имя, контакты, роль в системе и формат занятости.',
    schedule: 'Стандартные рабочие часы и формат — что увидит команда при планировании встреч.',
    team: 'Можно сразу привязать к команде или сделать это позже из профиля.',
    review: 'Финальная проверка перед созданием. Можно вернуться на любой пройденный шаг.',
  }
  const cardTitleMap: Record<StepKey, string> = {
    personal: 'Личные данные',
    schedule: 'Рабочий график',
    team: 'Команда (опционально)',
    review: 'Проверьте данные',
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <h1 className={s.title}>Добавление сотрудника</h1>
      </header>

      <div className={s.stepperWrap}>
        <Stepper steps={steps} onStepClick={handleStepClick} />
      </div>

      <Card padding="lg" className={s.card}>
        <div className={s.cardHeader}>
          <h2 className={s.cardTitle}>{cardTitleMap[step]}</h2>
          <p className={s.cardSubtitle}>{cardSubtitleMap[step]}</p>
        </div>

        {step === 'personal' && (
          <PersonalDataStep
            values={personal}
            onChange={handlePersonalChange}
            errors={fieldErrors}
            disabled={isSubmitting}
          />
        )}
        {step === 'schedule' && (
          <WorkScheduleStep
            values={schedule}
            onChange={handleScheduleChange}
            disabled={isSubmitting}
          />
        )}
        {step === 'team' && (
          <TeamStep
            values={team}
            onChange={handleTeamChange}
            teams={teamsStore.list.items}
            isLoading={teamsStore.list.loadingStage.isLoading}
            disabled={isSubmitting}
          />
        )}
        {step === 'review' && (
          <ReviewStep
            personal={personal}
            schedule={schedule}
            team={team}
            teams={teamsStore.list.items}
            onEdit={(index) => handleStepClick(index)}
          />
        )}

        {validationError && <div className={s.errorBox}>{validationError}</div>}
        {submitError && step === 'review' && <div className={s.errorBox}>{submitError}</div>}
      </Card>

      <div className={s.actions}>{renderActions()}</div>
    </div>
  )
})
