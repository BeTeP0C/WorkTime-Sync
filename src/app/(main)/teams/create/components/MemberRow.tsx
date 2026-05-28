import { Employee } from '@/entities/employee/model/types'
import { TEAM_ROLE_LABEL_RU, TEAM_ROLES, TeamRole } from '@/entities/team/model/types'
import { XSmallIcon } from '@/shared/icons'
import { Avatar } from '@/shared/ui/Avatar'
import { Select, SelectOption } from '@/shared/ui/Select'

import { extractUtcOffset } from './timezone'

import s from './MemberRow.module.scss'

const ROLE_OPTIONS: SelectOption<TeamRole>[] = TEAM_ROLES.map((role) => ({
  value: role,
  label: TEAM_ROLE_LABEL_RU[role],
}))

interface MemberRowProps {
  employee: Employee
  role: TeamRole
  onRoleChange: (id: string, role: TeamRole) => void
  onRemove: (id: string) => void
}

export function MemberRow({ employee, role, onRoleChange, onRemove }: MemberRowProps) {
  const utc = extractUtcOffset(employee.timezoneLabel)

  return (
    <div className={s.row}>
      <Avatar
        initials={employee.initials}
        fullName={employee.fullName}
        colorSeed={employee.id}
        size="md"
      />
      <div className={s.info}>
        <div className={s.name}>{employee.fullName}</div>
        <div className={s.position}>{employee.position}</div>
      </div>
      {utc && <span className={s.tz}>{utc}</span>}
      <Select<TeamRole>
        value={role}
        onValueChange={(v) => onRoleChange(employee.id, (v || 'member') as TeamRole)}
        options={ROLE_OPTIONS}
        size="sm"
        placeholder="Роль"
        className={s.roleSelect}
        aria-label="Роль участника"
      />
      <button
        type="button"
        className={s.removeBtn}
        onClick={() => onRemove(employee.id)}
        aria-label="Удалить из команды"
        title="Удалить из команды"
      >
        <XSmallIcon className={s.removeIcon} />
      </button>
    </div>
  )
}
