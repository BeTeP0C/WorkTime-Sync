'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { toast } from 'sonner'

import { useEmployeesStore, useTeamsStore } from '@/app-store/context'
import { Employee } from '@/entities/employee/model/types'
import { getTeamInitials } from '@/entities/team/lib/normalize'
import { TeamRole } from '@/entities/team/model/types'
import { ApiError } from '@/shared/api/client'
import { AngleRightIcon, PlusIcon, UndoIcon } from '@/shared/icons'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { Step, Stepper } from '@/shared/ui/Stepper'

import { MemberRow } from './components/MemberRow'
import { MemberSearch } from './components/MemberSearch'
import { ReviewStep } from './components/ReviewStep'
import { extractUtcOffset } from './components/timezone'
import { TimezoneBanner } from './components/TimezoneBanner'

import s from './CreateTeamClient.module.scss'

type StepKey = 'identity' | 'members' | 'review'

const STEP_ORDER: StepKey[] = ['identity', 'members', 'review']
const STEP_LABELS: Record<StepKey, string> = {
  identity: 'Основное',
  members: 'Сотрудники',
  review: 'Подтверждение',
}

const MIN_MEMBERS = 5
const MAX_MEMBERS = 10
const DEFAULT_TEAM_NAME = 'Новая команда'

function pickMajorityTz(members: Employee[]): string | null {
  if (members.length === 0) return null
  const counts = new Map<string, number>()
  for (const m of members) {
    counts.set(m.timezone, (counts.get(m.timezone) ?? 0) + 1)
  }
  let best: { tz: string; count: number } | null = null
  for (const [tz, count] of counts) {
    if (!best || count > best.count) best = { tz, count }
  }
  return best?.tz ?? null
}

export const CreateTeamClient = observer(function CreateTeamClient() {
  const employeesStore = useEmployeesStore()
  const teamsStore = useTeamsStore()
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement | null>(null)

  const [step, setStep] = useState<StepKey>('identity')
  const [teamName, setTeamName] = useState(DEFAULT_TEAM_NAME)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [rolesById, setRolesById] = useState<Record<string, TeamRole>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (employeesStore.list.isEmpty && !employeesStore.list.loadingStage.isLoading) {
      employeesStore.fetch()
    }
  }, [employeesStore])

  const allEmployees = employeesStore.list.items

  const selectedMembers = useMemo<Employee[]>(() => {
    return selectedIds
      .map((id) => allEmployees.find((e) => e.id === id))
      .filter((e): e is Employee => Boolean(e))
  }, [selectedIds, allEmployees])

  const candidates = useMemo<Employee[]>(() => {
    return allEmployees.filter((e) => !selectedIds.includes(e.id))
  }, [allEmployees, selectedIds])

  const majorityTz = useMemo(() => pickMajorityTz(selectedMembers), [selectedMembers])

  const outsiderMembers = useMemo<Employee[]>(() => {
    if (!majorityTz) return []
    return selectedMembers.filter((m) => m.timezone !== majorityTz)
  }, [selectedMembers, majorityTz])

  const handleAdd = (employee: Employee) => {
    if (selectedIds.length >= MAX_MEMBERS) {
      setValidationError(`Максимум ${MAX_MEMBERS} участников`)
      return
    }
    setValidationError(null)
    setSelectedIds((prev) => (prev.includes(employee.id) ? prev : [...prev, employee.id]))
    setRolesById((prev) => ({ ...prev, [employee.id]: prev[employee.id] ?? 'member' }))
  }

  const handleRemove = (id: string) => {
    setValidationError(null)
    setSelectedIds((prev) => prev.filter((x) => x !== id))
    setRolesById((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const handleRoleChange = (id: string, role: TeamRole) => {
    setRolesById((prev) => ({ ...prev, [id]: role }))
  }

  const handleAddMoreClick = () => {
    searchRef.current?.focus()
  }

  const handleBack = () => {
    if (step === 'identity') {
      router.push('/teams')
      return
    }
    const currentIndex = STEP_ORDER.indexOf(step)
    setStep(STEP_ORDER[currentIndex - 1])
    setValidationError(null)
    setSubmitError(null)
  }

  const handleNext = () => {
    setValidationError(null)
    if (step === 'identity') {
      if (!teamName.trim()) {
        setValidationError('Введите название команды')
        return
      }
      setStep('members')
      return
    }
    if (step === 'members') {
      if (selectedIds.length < MIN_MEMBERS) {
        setValidationError(`Минимум ${MIN_MEMBERS} участников`)
        return
      }
      if (selectedIds.length > MAX_MEMBERS) {
        setValidationError(`Максимум ${MAX_MEMBERS} участников`)
        return
      }
      setStep('review')
    }
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
    if (selectedIds.length < MIN_MEMBERS || selectedIds.length > MAX_MEMBERS) {
      setValidationError(`Нужно от ${MIN_MEMBERS} до ${MAX_MEMBERS} участников`)
      setStep('members')
      return
    }

    setIsSubmitting(true)
    try {
      const trimmedUrl = avatarUrl.trim()
      const team = await teamsStore.create({
        name: teamName.trim() || DEFAULT_TEAM_NAME,
        description: '',
        avatarUrl: trimmedUrl ? trimmedUrl : null,
        members: selectedIds.map((id) => ({
          employeeId: id,
          role: rolesById[id] ?? 'member',
        })),
      })
      toast.success(`Команда «${team.name}» создана`)
      router.push(`/teams/${team.id}`)
    } catch (error) {
      const msg =
        error instanceof ApiError ? error.detail : 'Не удалось создать команду. Попробуйте ещё раз.'
      setSubmitError(msg)
      toast.error(msg)
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
            {isSubmitting ? 'Создаём…' : 'Создать команду'}
          </Button>
        </>
      )
    }
    const nextLabel = step === 'identity' ? 'Далее — Сотрудники' : 'Далее — Подтверждение'
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
          {nextLabel}
        </Button>
      </>
    )
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <h1 className={s.title}>Создание команды</h1>
      </header>

      <div className={s.stepperWrap}>
        <Stepper steps={steps} onStepClick={handleStepClick} />
      </div>

      {step === 'identity' && (
        <Card padding="lg" className={s.card}>
          <div className={s.cardHeader}>
            <h2 className={s.cardTitle}>Идентичность команды</h2>
            <p className={s.cardSubtitle}>
              Название и иконка отображаются в списке команд и в шапке профиля.
            </p>
          </div>

          <div className={s.identityRow}>
            <Avatar
              initials={getTeamInitials(teamName || DEFAULT_TEAM_NAME)}
              fullName={teamName || DEFAULT_TEAM_NAME}
              colorSeed={teamName || DEFAULT_TEAM_NAME}
              src={avatarUrl.trim() || null}
              shape="squircle"
              size="lg"
            />
            <div className={s.identityFields}>
              <label className={s.fieldLabel}>
                <span>Название</span>
                <Input
                  size="md"
                  value={teamName}
                  placeholder={DEFAULT_TEAM_NAME}
                  onChange={(e) => setTeamName(e.target.value)}
                  fullWidth
                />
              </label>
              <label className={s.fieldLabel}>
                <span>URL иконки (опционально)</span>
                <Input
                  size="md"
                  type="url"
                  value={avatarUrl}
                  placeholder="https://example.com/icon.png"
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  fullWidth
                />
                <span className={s.fieldHint}>
                  Если пусто — отображаются инициалы на цветном фоне.
                </span>
              </label>
            </div>
          </div>

          {validationError && <div className={s.errorBox}>{validationError}</div>}
        </Card>
      )}

      {step === 'members' && (
        <Card padding="lg" className={s.card}>
          <div className={s.cardHeader}>
            <h2 className={s.cardTitle}>Добавление сотрудников</h2>
            <p className={s.cardSubtitle}>
              Найдите и добавьте участников команды. Минимум {MIN_MEMBERS}, максимум {MAX_MEMBERS}{' '}
              человек. Назначьте каждому роль.
            </p>
          </div>

          <MemberSearch
            ref={searchRef}
            candidates={candidates}
            onAdd={handleAdd}
            disabled={selectedIds.length >= MAX_MEMBERS}
          />

          <div className={s.list}>
            {selectedMembers.length === 0 ? (
              <div className={s.empty}>
                Пока никто не добавлен. Найдите сотрудников через поиск выше.
              </div>
            ) : (
              selectedMembers.map((emp) => (
                <MemberRow
                  key={emp.id}
                  employee={emp}
                  role={rolesById[emp.id] ?? 'member'}
                  onRoleChange={handleRoleChange}
                  onRemove={handleRemove}
                />
              ))
            )}
          </div>

          <button
            type="button"
            className={s.addMore}
            onClick={handleAddMoreClick}
            disabled={selectedIds.length >= MAX_MEMBERS}
          >
            <PlusIcon className={s.addMoreIcon} />
            <span>Добавить ещё сотрудника</span>
          </button>

          {outsiderMembers.length > 0 && (
            <div className={s.banners}>
              {outsiderMembers.map((m) => {
                const utc = extractUtcOffset(m.timezoneLabel) ?? m.timezone
                return (
                  <TimezoneBanner
                    key={m.id}
                    message={`${m.fullName} в другом часовом поясе (${utc}). Это будет учтено при расчёте командного окна.`}
                  />
                )
              })}
            </div>
          )}

          {validationError && <div className={s.errorBox}>{validationError}</div>}
        </Card>
      )}

      {step === 'review' && (
        <Card padding="lg" className={s.card}>
          <div className={s.cardHeader}>
            <h2 className={s.cardTitle}>Проверьте состав команды</h2>
            <p className={s.cardSubtitle}>
              Финальная проверка перед созданием. Можно вернуться на любой пройденный шаг через
              верхний степпер.
            </p>
          </div>

          <ReviewStep
            teamName={teamName.trim() || DEFAULT_TEAM_NAME}
            avatarUrl={avatarUrl.trim() || null}
            members={selectedMembers.map((emp) => ({
              employee: emp,
              role: rolesById[emp.id] ?? 'member',
            }))}
            majorityTimezone={majorityTz}
            outsiderEmployees={outsiderMembers}
          />

          {submitError && <div className={s.errorBox}>{submitError}</div>}
        </Card>
      )}

      <div className={s.actions}>{renderActions()}</div>
    </div>
  )
})
