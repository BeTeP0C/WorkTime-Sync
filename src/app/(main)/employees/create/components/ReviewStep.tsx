'use client'

import {
  EMPLOYMENT_TYPE_LABEL_RU,
  ROLE_LABEL_RU,
  WORK_FORMAT_LABEL_RU,
} from '@/entities/employee/model/types'
import { getTimezoneLabel } from '@/entities/schedule/model/options'
import { Team } from '@/entities/team/model/types'
import { TEAM_ROLE_LABEL_RU } from '@/entities/team/model/types'

import { PersonalDataValues } from './PersonalDataStep'
import { TeamValues } from './TeamStep'
import { WorkScheduleValues } from './WorkScheduleStep'

import s from './ReviewStep.module.scss'

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

interface ReviewStepProps {
  personal: PersonalDataValues
  schedule: WorkScheduleValues
  team: TeamValues
  teams: Team[]
  onEdit: (stepIndex: number) => void
}

export function ReviewStep({ personal, schedule, team, teams, onEdit }: ReviewStepProps) {
  const teamObj = team.teamId ? teams.find((t) => t.id === team.teamId) : null
  const sortedDays = [...schedule.workDays].sort((a, b) => a - b)

  return (
    <div className={s.root}>
      <ReviewCard
        title="Личные данные"
        onEdit={() => onEdit(0)}
        rows={[
          { label: 'ФИО', value: personal.fullName || '—' },
          { label: 'Email', value: personal.email || '—' },
          { label: 'Должность', value: personal.position || '—' },
          { label: 'Роль в системе', value: ROLE_LABEL_RU[personal.role] },
          {
            label: 'Тип занятости',
            value: EMPLOYMENT_TYPE_LABEL_RU[personal.employmentType],
          },
          { label: 'VK ID', value: personal.vkUserId || '—' },
        ]}
      />

      <ReviewCard
        title="Рабочий график"
        onEdit={() => onEdit(1)}
        rows={[
          {
            label: 'Часы',
            value: `${schedule.startTime} – ${schedule.endTime}`,
          },
          {
            label: 'Дни',
            value: sortedDays.length ? sortedDays.map((d) => DAY_LABELS[d]).join(', ') : '—',
          },
          { label: 'Часовой пояс', value: getTimezoneLabel(schedule.timezone) },
          { label: 'Формат', value: WORK_FORMAT_LABEL_RU[schedule.workFormat] },
        ]}
      />

      <ReviewCard
        title="Команда"
        onEdit={() => onEdit(2)}
        rows={[
          {
            label: 'Команда',
            value: teamObj ? teamObj.name : 'Без команды',
          },
          ...(team.teamId ? [{ label: 'Роль', value: TEAM_ROLE_LABEL_RU[team.roleInTeam] }] : []),
        ]}
      />
    </div>
  )
}

interface ReviewCardProps {
  title: string
  rows: Array<{ label: string; value: string }>
  onEdit: () => void
}

function ReviewCard({ title, rows, onEdit }: ReviewCardProps) {
  return (
    <div className={s.card}>
      <div className={s.cardHeader}>
        <h3 className={s.cardTitle}>{title}</h3>
        <button type="button" className={s.editBtn} onClick={onEdit}>
          Изменить
        </button>
      </div>
      <dl className={s.list}>
        {rows.map((row) => (
          <div key={row.label} className={s.row}>
            <dt className={s.rowLabel}>{row.label}</dt>
            <dd className={s.rowValue}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
