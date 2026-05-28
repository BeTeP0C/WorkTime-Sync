'use client'

import Link from 'next/link'
import { ComponentType, SVGProps, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'

import { useAuthStore, useRoadmapStore, useTeamsStore } from '@/app-store/context'
import {
  EmployeeProfileInitialData,
  EmployeeProfileStore,
} from '@/app-store/stores/EmployeeProfileStore'
import { ActivityEvent, EVENT_TYPE_LABEL_RU } from '@/entities/activity-event/model/types'
import { AiRecommendedAction } from '@/entities/ai/model/types'
import { isManagementRole } from '@/entities/auth/model/types'
import { Employee, RISK_LABEL_RU, WORK_FORMAT_LABEL_RU } from '@/entities/employee/model/types'
import {
  EXCEPTION_LABEL_RU,
  EXCEPTION_STATUS_RU,
  ScheduleException,
} from '@/entities/exception/model/types'
import { Recommendation } from '@/entities/recommendation/model/types'
import { WEEKDAY_LABEL_RU, WeekDayIndex } from '@/entities/schedule/model/types'
import {
  Team,
  TEAM_ROLE_BADGE_TONE,
  TEAM_ROLE_LABEL_RU,
  TeamRole,
} from '@/entities/team/model/types'
import {
  AngleRightIcon,
  PencilIcon,
  PlaneIcon,
  PokerChipIcon,
  ShieldExclamationIcon,
  SignOutIcon,
  SnowflakeIcon,
  UserIcon,
} from '@/shared/icons'
import { formatDateMonth, formatDateRange, formatRelativeUpdated } from '@/shared/lib/format'
import { Avatar } from '@/shared/ui/Avatar'
import { Badge, BadgeTone } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card, CardHeader } from '@/shared/ui/Card'
import { usePrompt } from '@/shared/ui/PromptDialog'
import { AddExceptionDrawer } from '@/widgets/AddExceptionDrawer'
import { AiResponseView } from '@/widgets/AiResponseView'
import { AiRiBreakdownCard } from '@/widgets/AiRiBreakdownCard'
import { AppHeader } from '@/widgets/AppHeader'
import { EditScheduleDrawer } from '@/widgets/EditScheduleDrawer'
import { EmployeeMetricsCards } from '@/widgets/EmployeeMetricsCards'
import { ManualEventDrawer } from '@/widgets/ManualEventDrawer'
import { RoadmapPreview } from '@/widgets/RoadmapPreview'

import { EmployeeProfileSkeleton } from './EmployeeProfileSkeleton'

import s from './EmployeeProfileClient.module.scss'

const EXCEPTION_TONE: Record<string, BadgeTone> = {
  vacation: 'info',
  sick_leave: 'success',
  business_trip: 'medium',
}

const EXCEPTION_ICON: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  vacation: PokerChipIcon,
  sick_leave: SnowflakeIcon,
  business_trip: PlaneIcon,
}

interface Props {
  employeeId: string
  initialData: EmployeeProfileInitialData | null
}

export const EmployeeProfileClient = observer(function EmployeeProfileClient({
  employeeId,
  initialData,
}: Props) {
  const [store] = useState(() => new EmployeeProfileStore(employeeId, initialData ?? undefined))
  const teamsStore = useTeamsStore()
  const authStore = useAuthStore()
  const roadmapStore = useRoadmapStore()
  const prompt = usePrompt()

  useEffect(() => {
    if (!store.loadingStage.isSuccessful) store.fetch()
  }, [store])

  useEffect(() => {
    if (!teamsStore.list.loadingStage.isSuccessful) teamsStore.fetch()
  }, [teamsStore])

  useEffect(() => {
    if (store.explainStage.isNotStarted) void store.explain()
  }, [store])

  const employee = store.employee.value
  const schedule = store.schedule.value
  const exceptions = store.exceptions.value
  const recommendations = store.recommendations.value
  const pendingRequest = store.pendingConfirmationRequest
  const currentUser = authStore.currentUser.value
  const isSelfProfile = currentUser?.id === employeeId
  const canManage = isManagementRole(currentUser?.role)
  const canConfirm = isSelfProfile || canManage
  const canRequest = canManage && !isSelfProfile
  const canEdit = isSelfProfile || canManage
  // RBAC по бэку: admin/hr/pm создают любому, остальные — только себе.
  const isEventPrivilegedRole =
    currentUser?.role === 'admin' || currentUser?.role === 'hr' || currentUser?.role === 'pm'
  const canCreateEvent = isSelfProfile || isEventPrivilegedRole
  const [openDrawer, setOpenDrawer] = useState<'schedule' | 'exception' | 'event' | null>(null)
  const [expandedRecs, setExpandedRecs] = useState<Set<string>>(() => new Set())

  const toggleRecExpanded = (key: string): void => {
    setExpandedRecs((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const aiExplanation = store.explanation.value
  const aiActions = aiExplanation?.recommendedActions ?? []
  const events = store.events.value
  const upcomingEvents = events
    .filter((e) => Date.parse(e.startDt) >= Date.now() - 60 * 60 * 1000)
    .sort((a, b) => Date.parse(a.startDt) - Date.parse(b.startDt))
    .slice(0, 7)

  const handleCreateEvent = async (
    payload: Parameters<typeof store.createEvent>[0]
  ): Promise<boolean> => store.createEvent(payload)

  const handleRequest = async () => {
    const reason = await prompt({
      title: 'Запрос на подтверждение графика',
      body: 'Сотрудник получит уведомление с просьбой подтвердить актуальность графика.',
      placeholder: 'Например: график не обновлялся 2 месяца',
      confirmLabel: 'Отправить запрос',
      multiline: true,
    })
    if (reason === null) return // отмена — не создаём запрос
    await store.requestConfirmation(reason.length > 0 ? reason : null)
  }

  const handleConfirm = async () => {
    await store.confirmSchedule()
  }

  const handleDecline = async (requestId: string) => {
    const note = await prompt({
      title: 'Отклонить запрос?',
      body: 'Запрос будет помечен как отклонённый. Комментарий увидит HR.',
      placeholder: 'Например: график вернётся к стандартному после спринта',
      confirmLabel: 'Отклонить',
      multiline: true,
    })
    if (note === null) return // отмена — не отклоняем запрос
    await store.declineConfirmation(requestId, note.length > 0 ? note : null)
  }

  const employeeTeams: Team[] = employee
    ? employee.teamIds.map((id) => teamsStore.getTeam(id)).filter((t): t is Team => Boolean(t))
    : []

  /**
   * Роль ищется в team.members; для команд, загруженных через `/teams` (без members),
   * показываем дефолт «Участник».
   */
  const roleFor = (team: Team, empId: string): TeamRole => {
    return team.members.find((m) => m.employeeId === empId)?.role ?? 'member'
  }

  if (store.loadingStage.isLoading || !employee) {
    return <EmployeeProfileSkeleton />
  }

  const m = employee.metric
  const riskTone: BadgeTone = m
    ? m.riskLevel === 'critical'
      ? 'critical'
      : m.riskLevel === 'high'
        ? 'high'
        : m.riskLevel === 'medium'
          ? 'medium'
          : 'low'
    : 'neutral'

  return (
    <>
      <AppHeader
        breadcrumb={
          <>
            <UserIcon className={s.crumbIcon} />
            <Link href="/diagnostics">Профили</Link>
          </>
        }
        title={employee.fullName}
        action={
          <>
            {canEdit && (
              <Button
                variant="secondary"
                size="md"
                leftIcon={<PencilIcon />}
                onClick={() => setOpenDrawer('schedule')}
              >
                Редактировать
              </Button>
            )}
            {canConfirm && (
              <Button
                variant="secondary"
                size="md"
                onClick={handleConfirm}
                disabled={store.confirmStage.isLoading}
              >
                Подтвердить актуальность
              </Button>
            )}
            {canRequest && (
              <Button
                variant="primary"
                size="md"
                leftIcon={<SignOutIcon />}
                onClick={handleRequest}
                disabled={Boolean(pendingRequest)}
              >
                {pendingRequest ? 'Запрос отправлен' : 'Запросить обновление'}
              </Button>
            )}
          </>
        }
      />

      <ProfileHero employee={employee} riskTone={riskTone} />

      {m && <EmployeeMetricsCards metric={m} />}

      <div className={s.grid}>
        <div className={s.gridCol}>
          <Card padding="lg" className={s.scheduleCard}>
            <CardHeader title="Рабочий график" />
            {schedule ? (
              <div className={s.schedule}>
                <div className={s.workdays}>
                  {([0, 1, 2, 3, 4, 5, 6] as WeekDayIndex[]).map((d) => (
                    <span
                      key={d}
                      className={schedule.workDays.includes(d) ? s.dayActive : s.dayInactive}
                    >
                      {WEEKDAY_LABEL_RU[d]}
                    </span>
                  ))}
                </div>
                <ScheduleRow
                  label="Рабочие часы"
                  value={`${schedule.startTime} — ${schedule.endTime}`}
                />
                <ScheduleRow label="Часовой пояс" value={employee.timezoneLabel} />
                <ScheduleRow
                  label="Формат работы"
                  value={WORK_FORMAT_LABEL_RU[employee.workFormat]}
                />
                <ScheduleRow
                  label="Последние обновления"
                  value={formatDateMonth(schedule.lastUpdatedAt)}
                  valueClassName={s.scheduleStale}
                />
                {schedule.confirmedAt && (
                  <ScheduleRow label="Подтверждено" value={formatDateMonth(schedule.confirmedAt)} />
                )}
              </div>
            ) : (
              <div className={s.empty}>График не задан</div>
            )}
          </Card>

          <Card padding="lg" className={s.exceptionsCard}>
            <CardHeader title="Исключения" />
            {exceptions.length === 0 ? (
              <div className={s.empty}>Запланированных исключений нет</div>
            ) : (
              <div className={s.exceptions}>
                {exceptions.map((exc) => (
                  <ExceptionRow key={exc.id} exc={exc} />
                ))}
              </div>
            )}
            {canEdit && (
              <Button
                variant="primary"
                size="md"
                className={s.addExceptionBtn}
                leftIcon={<span className={s.addExceptionPlus}>+</span>}
                onClick={() => setOpenDrawer('exception')}
              >
                Добавить исключение
              </Button>
            )}
          </Card>
        </div>

        <div className={s.gridCol}>
          <Card padding="lg" className={s.recsCard}>
            <CardHeader title="Рекомендации AI" />
            {recommendations.length === 0 ? (
              <div className={s.empty}>Рекомендаций нет — данные актуальны</div>
            ) : (
              <ul className={s.recs}>
                {recommendations.map((rec, idx) => {
                  const key = `${rec.code}-${idx}`
                  const aiAction = matchAiAction(rec, aiActions, idx)
                  const isExpanded = expandedRecs.has(key)
                  return (
                    <li key={key} className={s.recItem}>
                      <span className={s.recDot} />
                      <div className={s.recBody}>
                        <div className={s.recTitle}>{rec.title}</div>
                        <div className={s.recReason}>{rec.reason}</div>
                        {aiAction && (
                          <>
                            <button
                              type="button"
                              className={s.recExplainToggle}
                              onClick={() => toggleRecExpanded(key)}
                            >
                              {isExpanded ? '↑ Скрыть' : '🤖 Почему AI советует это?'}
                            </button>
                            {isExpanded && (
                              <div className={s.recExplainBody}>{aiAction.reason}</div>
                            )}
                          </>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          <Card padding="lg" className={s.teamsCard}>
            <CardHeader title="Команды сотрудника" />
            {employeeTeams.length === 0 ? (
              <div className={s.empty}>Сотрудник не состоит ни в одной команде</div>
            ) : (
              <ul className={s.teamsList}>
                {employeeTeams.map((team) => {
                  const role = roleFor(team, employee.id)
                  return (
                    <li key={team.id}>
                      <Link href={`/teams/${team.id}`} className={s.teamRow}>
                        <Avatar
                          initials={team.initials}
                          fullName={team.name}
                          colorSeed={team.id}
                          src={team.avatarUrl}
                          shape="squircle"
                          size="sm"
                        />
                        <div className={s.teamInfo}>
                          <div className={s.teamName}>{team.name}</div>
                          {team.description && (
                            <div className={s.teamDescription}>{team.description}</div>
                          )}
                        </div>
                        <Badge tone={TEAM_ROLE_BADGE_TONE[role]} size="sm" pill>
                          {TEAM_ROLE_LABEL_RU[role]}
                        </Badge>
                        <AngleRightIcon className={s.teamArrow} />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          <RoadmapPreview
            scope={{ kind: 'employee', employeeId }}
            limit={3}
            onGenerate={
              canManage
                ? async () => {
                    await roadmapStore.generate({ employeeId })
                  }
                : undefined
            }
            isGenerating={roadmapStore.generateLoading.isLoading}
          />

          <Card padding="lg" className={s.eventsCard}>
            <CardHeader
              title="События календаря"
              action={
                canCreateEvent ? (
                  <Button variant="secondary" size="sm" onClick={() => setOpenDrawer('event')}>
                    + Добавить
                  </Button>
                ) : undefined
              }
            />
            {upcomingEvents.length === 0 ? (
              <div className={s.empty}>Ближайших событий нет</div>
            ) : (
              <ul className={s.eventsList}>
                {upcomingEvents.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </ul>
            )}
          </Card>

          {employee.metric && (
            <AiRiBreakdownCard
              employeeId={employeeId}
              metric={employee.metric}
              explanation={aiExplanation}
              isExplanationLoading={store.explainStage.isInitial}
              explanationError={store.lastExplainError}
            />
          )}

          <Card padding="lg" className={s.aiExplainCard}>
            <CardHeader
              title="AI-объяснение риска"
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void store.explain()}
                  disabled={store.explainStage.isLoading}
                >
                  {store.explainStage.isLoading
                    ? 'Думаю…'
                    : store.explanation.value
                      ? 'Обновить'
                      : 'Сгенерировать'}
                </Button>
              }
            />
            {store.lastExplainError ? (
              <div className={s.aiExplainError}>{store.lastExplainError}</div>
            ) : store.explanation.value ? (
              <AiResponseView
                summary={store.explanation.value.summary}
                answer={store.explanation.value.answer}
                reasons={store.explanation.value.reasons}
                recommendedActions={store.explanation.value.recommendedActions}
                missingData={store.explanation.value.missingData}
                usedContext={store.explanation.value.usedContext}
                riskLevel={store.explanation.value.riskLevel}
              />
            ) : (
              <p className={s.aiExplainEmpty}>
                Нажмите «Сгенерировать», чтобы получить персональное объяснение риска и
                рекомендации.
              </p>
            )}
          </Card>

          <Card padding="lg" className={s.confirmCard}>
            <CardHeader title="Подтверждение актуальности" />
            {schedule?.confirmedAt ? (
              <p className={s.confirmText}>
                График подтверждён {formatDateMonth(schedule.confirmedAt)}.
              </p>
            ) : (
              <p className={s.confirmText}>
                Сотрудник не подтверждал актуальность данных {m?.daysSinceUpdate ?? 0} дня.
                {canRequest ? ' Отправьте запрос или попросите подтвердить график.' : ''}
              </p>
            )}
            {pendingRequest ? (
              <div className={s.confirmRows}>
                <ScheduleRow
                  label="Активный запрос"
                  value={formatDateMonth(pendingRequest.createdAt)}
                />
                {pendingRequest.requestedByName && (
                  <ScheduleRow label="От кого" value={pendingRequest.requestedByName} />
                )}
                {pendingRequest.reason && (
                  <ScheduleRow label="Причина" value={pendingRequest.reason} />
                )}
                {isSelfProfile && (
                  <div className={s.confirmActions}>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleConfirm}
                      disabled={store.confirmStage.isLoading}
                    >
                      Подтвердить
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => handleDecline(pendingRequest.id)}
                    >
                      Отклонить
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className={s.confirmRows}>
                <ScheduleRow label="Активный запрос" value="Нет" />
              </div>
            )}
          </Card>
        </div>
      </div>

      {openDrawer === 'schedule' && (
        <EditScheduleDrawer
          schedule={schedule}
          fallbackTimezone={employee.timezone}
          fallbackWorkFormat={employee.workFormat}
          isSubmitting={store.editStage.isLoading}
          error={store.lastEditError}
          onClose={() => setOpenDrawer(null)}
          onSubmit={async (payload) => {
            const ok = await store.createSchedule(payload)
            if (ok) setOpenDrawer(null)
          }}
        />
      )}
      {openDrawer === 'exception' && (
        <AddExceptionDrawer
          isSubmitting={store.editStage.isLoading}
          error={store.lastEditError}
          onClose={() => setOpenDrawer(null)}
          onSubmit={async (payload) => {
            const ok = await store.createException(payload)
            if (ok) setOpenDrawer(null)
          }}
        />
      )}
      <ManualEventDrawer
        isOpen={openDrawer === 'event'}
        onClose={() => setOpenDrawer(null)}
        onSubmit={handleCreateEvent}
        defaultTimezone={employee.timezone}
        errorMessage={store.lastEventError}
        isSubmitting={store.createEventStage.isLoading}
      />
    </>
  )
})

function EventRow({ event }: { event: ActivityEvent }) {
  const start = new Date(event.startDt)
  const end = new Date(event.endDt)
  const dateLabel = formatDateMonth(event.startDt)
  const timeLabel = `${formatTime(start)} — ${formatTime(end)}`
  const typeLabel =
    EVENT_TYPE_LABEL_RU[event.eventType as keyof typeof EVENT_TYPE_LABEL_RU] ?? event.eventType
  return (
    <li className={s.eventRow}>
      <div className={s.eventInfo}>
        <div className={s.eventTitle}>
          {event.title}
          {event.isRecurring && (
            <span className={s.eventBadgeIcon} title="Повторяющееся событие">
              ↻
            </span>
          )}
          {event.isOutsideSchedule && (
            <span className={s.eventBadgeIcon} title="Вне рабочего графика">
              ⚠
            </span>
          )}
        </div>
        <div className={s.eventMeta}>
          {dateLabel} · {timeLabel}
        </div>
      </div>
      <Badge tone="neutral" size="sm" pill>
        {typeLabel}
      </Badge>
    </li>
  )
}

function formatTime(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

/**
 * Сматчить рекомендацию из RecommendationsStore с AI-рекомендацией из
 * /ai/employees/{id}/explain — сначала по пересечению слов в action,
 * затем по индексу как fallback.
 */
function matchAiAction(
  rec: Recommendation,
  aiActions: AiRecommendedAction[],
  idx: number
): AiRecommendedAction | undefined {
  if (aiActions.length === 0) return undefined
  const recTokens = tokenize(rec.action || rec.title)
  let bestScore = 0
  let best: AiRecommendedAction | undefined
  for (const ai of aiActions) {
    const aiTokens = tokenize(ai.action)
    const score = intersectCount(recTokens, aiTokens)
    if (score > bestScore) {
      bestScore = score
      best = ai
    }
  }
  if (best && bestScore >= 2) return best
  return aiActions[idx] ?? undefined
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-zа-я0-9\s]/gi, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4)
  )
}

function intersectCount(a: Set<string>, b: Set<string>): number {
  let n = 0
  a.forEach((w) => {
    if (b.has(w)) n += 1
  })
  return n
}

function ProfileHero({ employee, riskTone }: { employee: Employee; riskTone: BadgeTone }) {
  return (
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
          <span>{employee.position}</span>
          <span>{employee.department}</span>
        </div>
        <div className={s.heroTags}>
          <Badge tone="primary" size="lg">
            {WORK_FORMAT_LABEL_RU[employee.workFormat]}
          </Badge>
          <Badge tone="success" size="lg">
            {employee.timezoneLabel}
          </Badge>
          <Badge tone="warning" size="lg">
            {formatRelativeUpdated(employee.updatedAt)}
          </Badge>
        </div>
      </div>
      {employee.metric && (
        <Badge tone={riskTone} size="lg" className={s.heroRiskBadge}>
          <ShieldExclamationIcon className={s.heroRiskIcon} />
          {RISK_LABEL_RU[employee.metric.riskLevel]} риск
        </Badge>
      )}
    </Card>
  )
}

function ScheduleRow({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className={s.scheduleRow}>
      <span className={s.scheduleLabel}>{label}</span>
      <span className={`${s.scheduleValue} ${valueClassName ?? ''}`}>{value}</span>
    </div>
  )
}

function ExceptionRow({ exc }: { exc: ScheduleException }) {
  const Icon = EXCEPTION_ICON[exc.type]
  return (
    <div className={s.exceptionRow}>
      <div className={`${s.exceptionIconBg} ${s[`exceptionIconBg_${exc.type}`] ?? ''}`}>
        {Icon && <Icon className={s.exceptionIcon} />}
      </div>
      <div className={s.exceptionInfo}>
        <div className={s.exceptionTitle}>{EXCEPTION_LABEL_RU[exc.type]}</div>
        <div className={s.exceptionDates}>{formatDateRange(exc.startDt, exc.endDt)}</div>
      </div>
      <Badge tone={EXCEPTION_TONE[exc.type]} size="lg" pill>
        {EXCEPTION_STATUS_RU[exc.status]}
      </Badge>
    </div>
  )
}
