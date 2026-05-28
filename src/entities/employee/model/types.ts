export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export type WorkFormat = 'office' | 'remote' | 'hybrid'

export type EmployeeRole = 'manager' | 'pm' | 'hr' | 'analyst' | 'admin' | 'employee'

export type EmploymentType = 'full_time' | 'part_time' | 'contract'

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
  zone_factor?: number // Zi ∈ [0, 1]
  hr_factor?: number // Hi ∈ [0, 1]
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
  hire_date?: string | null
  timezone: string // IANA, e.g. "Europe/Moscow"
  timezone_label?: string | null // "UTC+3 Москва" — добавляется на бэке/моке для удобства
  work_format: WorkFormat
  employment_type?: EmploymentType
  created_at: string
  updated_at: string
  team_ids?: string[]
  metric?: EmployeeMetricRaw | null
  has_pending_confirmation?: boolean
}

/** Нормализованная модель для фронта (camelCase) */
export interface EmployeeMetric {
  daysSinceUpdate: number
  actualityScore: number
  conflictRate: number
  loadLevel: number
  zoneFactor: number
  hrFactor: number
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
  hireDate: string | null
  timezone: string
  timezoneLabel: string
  workFormat: WorkFormat
  employmentType: EmploymentType
  teamIds: string[]
  metric: EmployeeMetric | null
  updatedAt: string
  hasPendingConfirmation: boolean
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
  manager: 'Руководитель',
  pm: 'Проектный менеджер',
  hr: 'HR-специалист',
  analyst: 'Аналитик',
  admin: 'Администратор',
  employee: 'Сотрудник',
}

export const EMPLOYMENT_TYPE_LABEL_RU: Record<EmploymentType, string> = {
  full_time: 'Полная занятость',
  part_time: 'Частичная занятость',
  contract: 'Контракт',
}
