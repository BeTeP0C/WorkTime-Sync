import { API_URLS } from '@/shared/api/apiUrls'
import { apiClient } from '@/shared/api/client'

import {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
  VkLoginStartResponse,
} from '../model/types'

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiClient<AuthResponse>('POST', API_URLS.authLogin(), { body: payload })
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  return apiClient<AuthResponse>('POST', API_URLS.authRegister(), { body: payload })
}

export async function getCurrentUser(): Promise<User> {
  return apiClient<User>('GET', API_URLS.authMe())
}

export async function startVkLogin(): Promise<VkLoginStartResponse> {
  return apiClient<VkLoginStartResponse>('GET', API_URLS.authVkLogin())
}

export async function completeVkLogin(code: string): Promise<AuthResponse> {
  return apiClient<AuthResponse>('GET', API_URLS.authVkCallback(code))
}

/** Серверный logout: ревокирует refresh-токен в БД и очищает HttpOnly cookie. */
export async function logoutServerSession(): Promise<void> {
  await apiClient<void>('POST', API_URLS.authLogout())
}

/**
 * Обмен HttpOnly refresh-cookie на новый access-токен.
 * Cookie уходит автоматически с credentials: 'include'.
 * При 401 apiClient не ретраит refresh сам — выбросит ApiError, вызывающий
 * должен очистить сессию (см. AuthStore).
 */
export async function refreshAuth(): Promise<AuthResponse> {
  return apiClient<AuthResponse>('POST', API_URLS.authRefresh())
}
