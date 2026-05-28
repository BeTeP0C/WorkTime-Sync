'use client'

import { useEffect, useState } from 'react'
import cn from 'classnames'
import { observer } from 'mobx-react-lite'

import { useAuthStore, useTeamsStore } from '@/app-store/context'
import { EmployeeProfileStore } from '@/app-store/stores/EmployeeProfileStore'
import { WORK_FORMAT_LABEL_RU } from '@/entities/employee/model/types'
import { PencilIcon } from '@/shared/icons'
import { formatRelativeUpdated } from '@/shared/lib/format'
import { Avatar } from '@/shared/ui/Avatar'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { AppHeader } from '@/widgets/AppHeader'
import { ConfirmActualityPanel } from '@/widgets/ConfirmActualityPanel'
import { EditScheduleDrawer } from '@/widgets/EditScheduleDrawer'
import { MyMetricsCards } from '@/widgets/MyMetricsCards'
import { MyRecommendationsList } from '@/widgets/MyRecommendationsList'
import { ProfileChangeHistory } from '@/widgets/ProfileChangeHistory'
import { ProfileContactForm } from '@/widgets/ProfileContactForm'

import s from './MyProfileClient.module.scss'

type ToneKey = 'critical' | 'high' | 'medium' | 'success'

function aiTone(value: number): ToneKey {
  if (value < 0.4) return 'critical'
  if (value < 0.7) return 'high'
  if (value < 0.9) return 'medium'
  return 'success'
}

function aiHint(value: number): string {
  if (value < 0.4) return 'Низкая актуальность'
  if (value < 0.7) return 'Скоро потребует обновления'
  if (value < 0.9) return 'Хорошая актуальность'
  return 'Полностью актуально'
}

export const MyProfileClient = observer(function MyProfileClient() {
  const authStore = useAuthStore()
  const teamsStore = useTeamsStore()
  const currentUser = authStore.currentUser.value
  const employeeId = currentUser?.id ?? null

  const [store, setStore] = useState<EmployeeProfileStore | null>(null)
  const [scheduleDrawerOpen, setScheduleDrawerOpen] = useState(false)

  // Стор создаётся, как только узнаём id текущего пользователя.
  useEffect(() => {
    if (!employeeId) return
    const next = new EmployeeProfileStore(employeeId)
    setStore(next)
    void next.fetch()
  }, [employeeId])

  useEffect(() => {
    if (!teamsStore.list.loadingStage.isSuccessful) teamsStore.fetch()
  }, [teamsStore])

  if (!store || !employeeId) {
    return <div className={s.skeleton}>Загружаем профиль…</div>
  }

  const employee = store.employee.value
  const schedule = store.schedule.value

  if (store.loadingStage.isLoading || !employee) {
    return <div className={s.skeleton}>Загружаем профиль…</div>
  }

  const metric = employee.metric
  const ai = metric?.actualityScore ?? null
  const ai_t: ToneKey = ai === null ? 'medium' : aiTone(ai)

  const teamName = employee.teamIds[0]
    ? (teamsStore.getTeam(employee.teamIds[0])?.name ?? null)
    : null

  return (
    <>
      <AppHeader
        title="Мой профиль"
        action={
          <>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<PencilIcon />}
              onClick={() => setScheduleDrawerOpen(true)}
            >
              Редактировать график
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => void store.confirmSchedule()}
              disabled={store.confirmStage.isLoading}
            >
              {store.confirmStage.isLoading ? 'Сохраняем…' : 'Подтвердить актуальность'}
            </Button>
          </>
        }
      />

      <Card padding="lg" className={s.hero}>
        <Avatar
          initials={employee.initials}
          fullName={employee.fullName}
          colorSeed={employee.id}
          size="xl"
        />
        <div className={s.heroInfo}>
          <h2 className={s.heroName}>{employee.fullName}</h2>
          <div className={s.heroPosition}>
            <span>{employee.position || '—'}</span>
            {teamName && <span>{teamName}</span>}
          </div>
          <div className={s.heroTags}>
            <Badge tone="primary" size="md">
              {WORK_FORMAT_LABEL_RU[employee.workFormat]}
            </Badge>
            <Badge tone="info" size="md">
              {employee.timezoneLabel}
            </Badge>
            <Badge tone="warning" size="md">
              {formatRelativeUpdated(employee.updatedAt)}
            </Badge>
          </div>
        </div>
        <div className={s.heroAi}>
          <span className={s.heroAiLabel}>Мой Ai</span>
          <span className={cn(s.heroAiValue, s[`tone_${ai_t}`])}>
            {ai === null ? '—' : ai.toFixed(2)}
          </span>
          <span className={cn(s.heroAiHint, s[`tone_${ai_t}`])}>
            {ai === null ? 'Нет данных' : aiHint(ai)}
          </span>
        </div>
      </Card>

      <div className={s.grid}>
        <div className={s.col}>
          <ProfileContactForm
            employee={employee}
            teamName={teamName}
            isSubmitting={store.updateStage.isLoading}
            error={store.lastUpdateError}
            onSubmit={(payload) => store.updateProfile(payload)}
          />
          {metric && <MyMetricsCards metric={metric} />}
          <MyRecommendationsList
            employeeId={employeeId}
            metric={metric}
            recommendations={store.recommendations.value}
          />
        </div>

        <div className={s.sideCol}>
          <ConfirmActualityPanel
            daysSinceUpdate={metric?.daysSinceUpdate ?? 0}
            scheduleConfirmedAt={schedule?.confirmedAt ?? null}
            pendingRequest={store.pendingConfirmationRequest}
            isConfirming={store.confirmStage.isLoading}
            onConfirm={() => store.confirmSchedule()}
            onRequestUpdate={() => setScheduleDrawerOpen(true)}
          />
          <ProfileChangeHistory entries={store.history.value} limit={3} />
        </div>
      </div>

      {scheduleDrawerOpen && (
        <EditScheduleDrawer
          schedule={schedule}
          fallbackTimezone={employee.timezone}
          isSubmitting={store.editStage.isLoading}
          error={store.lastEditError}
          onClose={() => setScheduleDrawerOpen(false)}
          onSubmit={async (payload) => {
            const ok = await store.createSchedule(payload)
            if (ok) setScheduleDrawerOpen(false)
          }}
        />
      )}
    </>
  )
})
