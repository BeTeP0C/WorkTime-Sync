import { Employee } from '@/entities/employee/model/types'
import { getTeamInitials } from '@/entities/team/lib/normalize'
import { TEAM_ROLE_BADGE_TONE, TEAM_ROLE_LABEL_RU, TeamRole } from '@/entities/team/model/types'
import { InfoIcon, WarningSmallIcon } from '@/shared/icons'
import { Avatar } from '@/shared/ui/Avatar'
import { Badge } from '@/shared/ui/Badge'

import { extractUtcOffset } from './timezone'

import s from './ReviewStep.module.scss'

interface ReviewMember {
  employee: Employee
  role: TeamRole
}

interface ReviewStepProps {
  teamName: string
  avatarUrl: string | null
  members: ReviewMember[]
  majorityTimezone: string | null
  outsiderEmployees: Employee[]
}

export function ReviewStep({
  teamName,
  avatarUrl,
  members,
  majorityTimezone,
  outsiderEmployees,
}: ReviewStepProps) {
  const majorityLabel = majorityTimezone
    ? (members.find((m) => m.employee.timezone === majorityTimezone)?.employee.timezoneLabel ??
      majorityTimezone)
    : null

  const warnings: string[] = []
  if (members.length < 5) {
    warnings.push('Меньше 5 участников — это может ограничить аналитику команды.')
  }
  if (outsiderEmployees.length > 0) {
    warnings.push(
      `${outsiderEmployees.length} ${outsiderEmployees.length === 1 ? 'участник' : 'участника'} в другом часовом поясе — общее окно команды будет уже.`
    )
  }
  const hasLead = members.some((m) => m.role === 'lead')
  if (!hasLead) {
    warnings.push('Не назначен лид — рекомендуется выбрать кого-то на эту роль.')
  }

  return (
    <div className={s.root}>
      <div className={s.identity}>
        <Avatar
          initials={getTeamInitials(teamName)}
          fullName={teamName}
          colorSeed={teamName}
          src={avatarUrl}
          shape="squircle"
          size="lg"
        />
        <div className={s.identityInfo}>
          <div className={s.teamName}>{teamName}</div>
          <div className={s.identityMeta}>
            {members.length} {members.length === 1 ? 'участник' : 'участников'}
            {majorityLabel && (
              <>
                <span className={s.metaDot}>·</span>
                <span>Основная таймзона: {majorityLabel}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={s.section}>
        <div className={s.sectionTitle}>Состав команды</div>
        <ul className={s.membersList}>
          {members.map(({ employee, role }) => {
            const utc = extractUtcOffset(employee.timezoneLabel)
            const isOutsider = outsiderEmployees.some((o) => o.id === employee.id)
            return (
              <li key={employee.id} className={s.memberRow}>
                <Avatar
                  initials={employee.initials}
                  fullName={employee.fullName}
                  colorSeed={employee.id}
                  size="sm"
                />
                <div className={s.memberInfo}>
                  <div className={s.memberName}>{employee.fullName}</div>
                  <div className={s.memberPosition}>{employee.position || '—'}</div>
                </div>
                <Badge tone={TEAM_ROLE_BADGE_TONE[role]} size="sm" pill>
                  {TEAM_ROLE_LABEL_RU[role]}
                </Badge>
                <span className={s.memberTz} title={isOutsider ? 'Другая таймзона' : undefined}>
                  {utc || employee.timezone}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      {warnings.length > 0 && (
        <div className={s.warnings}>
          {warnings.map((w, i) => (
            <div key={i} className={s.warning}>
              <WarningSmallIcon className={s.warningIcon} />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      <div className={s.hint}>
        <InfoIcon className={s.hintIcon} />
        <span>
          После создания команда появится в списке `/teams`, метрики (актуальность, нагрузка)
          рассчитаются автоматически.
        </span>
      </div>
    </div>
  )
}
