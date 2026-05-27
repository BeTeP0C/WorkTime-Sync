import { API_URLS } from '@/shared/api/apiUrls'
import { apiClient } from '@/shared/api/client'

import { AuthResponse, LoginPayload, RegisterPayload, User } from '../model/types'

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiClient<AuthResponse>('POST', API_URLS.authLogin(), { body: payload })
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  return apiClient<AuthResponse>('POST', API_URLS.authRegister(), { body: payload })
}

export async function getCurrentUser(): Promise<User> {
  return apiClient<User>('GET', API_URLS.authMe())
}
