export type UserRole = 'manager' | 'employee'

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

export const USER_ROLE_LABEL_RU: Record<UserRole, string> = {
  manager: 'Руководитель',
  employee: 'Сотрудник',
}
