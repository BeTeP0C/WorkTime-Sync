export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export type WorkFormat = 'office' | 'remote' | 'hybrid'

export type EmployeeRole = 'head' | 'pm' | 'hr' | 'analyst' | 'admin' | 'employee'

/** Сырой ответ бэка (snake_case) */
export interface EmployeeMetricRaw {
  id: string
  employee_id: string
  calculated_at: string
  days_since_update: number
  actuality_score: number // Ai ∈ [0, 1]
  outside_events_count: number
  total_events_count: number
  conflict_rate: number // Ci ∈ [0, 1]
  load_level: number // Li ∈ [0, +∞)
  risk_score: number // Ri ∈ [0, 1]
  risk_level: RiskLevel
}

export interface EmployeeRaw {
  id: string
  vk_user_id: string | null
  role: EmployeeRole
  full_name: string
  email: string | null
  position: string | null
  department?: string | null
  timezone: string // IANA, e.g. "Europe/Moscow"
  timezone_label?: string | null // "UTC+3 Москва" — добавляется на бэке/моке для удобства
  work_format: WorkFormat
  created_at: string
  updated_at: string
  team_ids?: string[]
  metric?: EmployeeMetricRaw | null
}

/** Нормализованная модель для фронта (camelCase) */
export interface EmployeeMetric {
  daysSinceUpdate: number
  actualityScore: number
  conflictRate: number
  loadLevel: number
  riskScore: number
  riskLevel: RiskLevel
  outsideEventsCount: number
  totalEventsCount: number
}

export interface Employee {
  id: string
  fullName: string
  initials: string
  firstName: string
  lastName: string
  role: EmployeeRole
  position: string
  department: string
  email: string | null
  timezone: string
  timezoneLabel: string
  workFormat: WorkFormat
  teamIds: string[]
  metric: EmployeeMetric | null
  updatedAt: string
}

export const RISK_LABEL_RU: Record<RiskLevel, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  critical: 'Критический',
}

export const RISK_SHORT_LABEL_RU: Record<RiskLevel, string> = {
  low: 'низк.',
  medium: 'средн.',
  high: 'высок.',
  critical: 'крит.',
}

export const WORK_FORMAT_LABEL_RU: Record<WorkFormat, string> = {
  office: 'Офис',
  remote: 'Удалёнка',
  hybrid: 'Гибрид',
}

export const ROLE_LABEL_RU: Record<EmployeeRole, string> = {
  head: 'Руководитель',
  pm: 'Проектный менеджер',
  hr: 'HR-специалист',
  analyst: 'Аналитик',
  admin: 'Администратор',
  employee: 'Сотрудник',
}
