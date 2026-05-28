'use client'

import { Team } from '@/entities/team/model/types'
import { TEAM_ROLE_LABEL_RU, TEAM_ROLES, TeamRole } from '@/entities/team/model/types'
import { Select, SelectOption } from '@/shared/ui/Select'

import s from './TeamStep.module.scss'

const ROLE_OPTIONS: SelectOption<TeamRole>[] = TEAM_ROLES.map((role) => ({
  value: role,
  label: TEAM_ROLE_LABEL_RU[role],
}))

export interface TeamValues {
  teamId: string | null
  roleInTeam: TeamRole
}

interface TeamStepProps {
  values: TeamValues
  onChange: (patch: Partial<TeamValues>) => void
  teams: Team[]
  isLoading: boolean
  disabled?: boolean
}

const NO_TEAM = '__no_team__'

export function TeamStep({ values, onChange, teams, isLoading, disabled }: TeamStepProps) {
  const teamOptions: SelectOption<string>[] = [
    { value: NO_TEAM, label: '— Без команды —' },
    ...teams.map((t) => ({
      value: t.id,
      label: t.name + (t.membersCount !== null ? ` · ${t.membersCount} чел.` : ''),
    })),
  ]

  const currentTeamValue = values.teamId ?? NO_TEAM

  return (
    <div className={s.root}>
      <p className={s.hint}>
        Привязка к команде опциональна — сотрудника можно добавить в команду позже из его профиля.
      </p>

      <label className={s.field}>
        <span className={s.fieldLabel}>Команда</span>
        <Select<string>
          value={currentTeamValue}
          onValueChange={(v) => onChange({ teamId: v === NO_TEAM || !v ? null : v })}
          options={teamOptions}
          placeholder={isLoading ? 'Загружаем…' : ''}
          disabled={disabled || isLoading}
        />
      </label>

      {values.teamId && (
        <label className={s.field}>
          <span className={s.fieldLabel}>Роль в команде *</span>
          <Select<TeamRole>
            value={values.roleInTeam}
            onValueChange={(v) => v && onChange({ roleInTeam: v as TeamRole })}
            options={ROLE_OPTIONS}
            placeholder=""
            disabled={disabled}
          />
        </label>
      )}
    </div>
  )
}
