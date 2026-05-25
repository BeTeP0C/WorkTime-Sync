import { Employee, EmployeeMetric, EmployeeMetricRaw, EmployeeRaw } from '../model/types'

function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.split(' ').filter(Boolean)
  // Бэк может прислать "Фамилия Имя" или "Имя Фамилия". В моках используем "Имя Фамилия".
  const [firstName = '', lastName = ''] = parts
  return { firstName, lastName }
}

function normalizeMetric(raw: EmployeeMetricRaw | null | undefined): EmployeeMetric | null {
  if (!raw) return null
  return {
    daysSinceUpdate: raw.days_since_update,
    actualityScore: raw.actuality_score,
    conflictRate: raw.conflict_rate,
    loadLevel: raw.load_level,
    riskScore: raw.risk_score,
    riskLevel: raw.risk_level,
    outsideEventsCount: raw.outside_events_count,
    totalEventsCount: raw.total_events_count,
  }
}

export function normalizeEmployee(raw: EmployeeRaw): Employee {
  const { firstName, lastName } = splitName(raw.full_name)

  return {
    id: raw.id,
    fullName: raw.full_name,
    initials: getInitials(raw.full_name),
    firstName,
    lastName,
    role: raw.role,
    position: raw.position ?? '',
    department: raw.department ?? '',
    email: raw.email,
    timezone: raw.timezone,
    timezoneLabel: raw.timezone_label ?? raw.timezone,
    workFormat: raw.work_format,
    teamIds: raw.team_ids ?? [],
    metric: normalizeMetric(raw.metric ?? null),
    updatedAt: raw.updated_at,
  }
}
