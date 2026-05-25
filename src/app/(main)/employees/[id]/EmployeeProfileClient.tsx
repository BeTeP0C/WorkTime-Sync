'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'

import { EmployeeProfileStore } from '@/app-store/stores/EmployeeProfileStore'
import { Employee, RISK_LABEL_RU, WORK_FORMAT_LABEL_RU } from '@/entities/employee/model/types'
import {
  EXCEPTION_LABEL_RU,
  EXCEPTION_STATUS_RU,
  ScheduleException,
} from '@/entities/exception/model/types'
import { Recommendation, SEVERITY_LABEL_RU } from '@/entities/recommendation/model/types'
import { WEEKDAY_LABEL_RU, WeekDayIndex } from '@/entities/schedule/model/types'
import { formatDateMonth, formatDateRange, formatRelativeUpdated } from '@/shared/lib/format'
import { Avatar } from '@/shared/ui/Avatar'
import { Badge, BadgeTone } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card, CardHeader } from '@/shared/ui/Card'
import { AppHeader } from '@/widgets/AppHeader'
import { EmployeeMetricsCards } from '@/widgets/EmployeeMetricsCards'

import s from './EmployeeProfileClient.module.scss'

const EXCEPTION_TONE: Record<string, BadgeTone> = {
  vacation: 'info',
  sick_leave: 'success',
  business_trip: 'medium',
}

const EXCEPTION_ICON: Record<string, string> = {
  vacation: '🏖',
  sick_leave: '🤒',
  business_trip: '✈',
}

const SEVERITY_TONE: Record<Recommendation['severity'], BadgeTone> = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
}

interface Props {
  employeeId: string
}

export const EmployeeProfileClient = observer(function EmployeeProfileClient({
  employeeId,
}: Props) {
  const [store] = useState(() => new EmployeeProfileStore(employeeId))

  useEffect(() => {
    store.fetch()
  }, [store])

  const employee = store.employee.value
  const schedule = store.schedule.value
  const exceptions = store.exceptions.value
  const recommendations = store.recommendations.value

  if (store.loadingStage.isLoading || !employee) {
    return (
      <>
        <AppHeader title="Загрузка..." />
        <div className={s.empty}>Загружаем профиль…</div>
      </>
    )
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
            <Link href="/diagnostics">Профили</Link>
            <span>›</span>
            <span>{employee.fullName}</span>
          </>
        }
        title={employee.fullName}
        action={
          <>
            <Button variant="secondary" size="md">
              Редактировать
            </Button>
            <Button variant="primary" size="md">
              Запросить обновление
            </Button>
          </>
        }
      />

      <ProfileHero employee={employee} riskTone={riskTone} />

      {m && <EmployeeMetricsCards metric={m} />}

      <div className={s.grid}>
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
                label="Последнее обновление"
                value={formatDateMonth(schedule.lastUpdatedAt)}
                valueClassName={s.scheduleStale}
              />
            </div>
          ) : (
            <div className={s.empty}>График не задан</div>
          )}
        </Card>

        <Card padding="lg" className={s.recsCard}>
          <CardHeader title="Рекомендации AI" />
          {recommendations.length === 0 ? (
            <div className={s.empty}>Рекомендаций нет — данные актуальны</div>
          ) : (
            <ul className={s.recs}>
              {recommendations.map((rec, idx) => (
                <li key={`${rec.code}-${idx}`} className={s.recItem}>
                  <span className={`${s.recDot} ${s[`recDot_${rec.severity}`]}`} />
                  <div className={s.recBody}>
                    <div className={s.recTitle}>{rec.title}</div>
                    <div className={s.recReason}>{rec.reason}</div>
                  </div>
                  <Badge tone={SEVERITY_TONE[rec.severity]} size="sm">
                    {SEVERITY_LABEL_RU[rec.severity]}
                  </Badge>
                </li>
              ))}
            </ul>
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
          <Button variant="secondary" size="sm" className={s.addExceptionBtn}>
            + Добавить исключение
          </Button>
        </Card>

        <Card padding="lg" className={s.confirmCard}>
          <CardHeader title="Подтверждение актуальности" />
          <p className={s.confirmText}>
            Сотрудник не подтверждал актуальность данных {m?.daysSinceUpdate ?? 0} дня. Отправьте
            запрос на подтверждение или обновление графика.
          </p>
          <div className={s.confirmRows}>
            <ScheduleRow label="Последний запрос" value="15 апр 2026" />
            <ScheduleRow label="Статус ответа" value="Нет ответа" valueClassName={s.confirmStale} />
          </div>
        </Card>
      </div>
    </>
  )
})

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
          {employee.position} · {employee.department}
        </div>
        <div className={s.heroTags}>
          <Badge tone="primary" size="md">
            {WORK_FORMAT_LABEL_RU[employee.workFormat]}
          </Badge>
          <Badge tone="success" size="md">
            {employee.timezoneLabel}
          </Badge>
          <Badge tone="warning" size="md">
            {formatRelativeUpdated(employee.updatedAt)}
          </Badge>
        </div>
      </div>
      {employee.metric && (
        <Badge tone={riskTone} size="md" pill>
          ⚠ {RISK_LABEL_RU[employee.metric.riskLevel]} риск
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
  return (
    <div className={s.exceptionRow}>
      <span className={s.exceptionIcon}>{EXCEPTION_ICON[exc.type]}</span>
      <div className={s.exceptionInfo}>
        <div className={s.exceptionTitle}>{EXCEPTION_LABEL_RU[exc.type]}</div>
        <div className={s.exceptionDates}>{formatDateRange(exc.startDt, exc.endDt)}</div>
      </div>
      <Badge tone={EXCEPTION_TONE[exc.type]} size="sm">
        {EXCEPTION_STATUS_RU[exc.status]}
      </Badge>
    </div>
  )
}
