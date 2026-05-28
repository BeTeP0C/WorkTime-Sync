export type UserRole = 'manager' | 'employee' | 'hr' | 'pm' | 'analyst' | 'admin'

export const MANAGEMENT_ROLES: ReadonlySet<UserRole> = new Set<UserRole>([
  'manager',
  'hr',
  'pm',
  'admin',
])

/**
 * Аналитик навигационно ходит с HR (видит сводки по сотрудникам), но
 * управленческих прав в TeamsPageClient/EmployeeProfileClient у него нет —
 * для этих контролов остаётся `isManagementRole`.
 */
export const HR_NAV_ROLES: ReadonlySet<UserRole> = new Set<UserRole>([
  ...MANAGEMENT_ROLES,
  'analyst',
])

export function isManagementRole(role: UserRole | string | null | undefined): boolean {
  return Boolean(role) && MANAGEMENT_ROLES.has(role as UserRole)
}

export function isHrNavRole(role: UserRole | string | null | undefined): boolean {
  return Boolean(role) && HR_NAV_ROLES.has(role as UserRole)
}

export interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  initials: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  fullName: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface VkLoginStartResponse {
  authorization_url: string
}

export const USER_ROLE_LABEL_RU: Record<UserRole, string> = {
  manager: 'Руководитель',
  employee: 'Сотрудник',
  hr: 'HR-специалист',
  pm: 'Проектный менеджер',
  analyst: 'Аналитик',
  admin: 'Администратор',
}
