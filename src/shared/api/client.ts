import qs from 'qs'
import { toast } from 'sonner'

import { API_BASE } from '@/shared/config/env'
import { safeGetRaw, safeSet } from '@/shared/lib/localStorage'

import { HttpMethod } from './apiUrls'

export interface ApiClientOptions {
  body?: unknown
  query?: Record<string, unknown>
  headers?: Record<string, string>
  signal?: AbortSignal
}

export const AUTH_TOKEN_STORAGE_KEY = 'auth.token'
export const AUTH_USER_STORAGE_KEY = 'auth.user'

const REFRESH_ENDPOINT = '/auth/refresh'

/** Серверные detail-строки → понятный русский текст. Что нет в таблице —
 *  отдаётся как есть (бэк часто уже пишет по-русски). */
const SERVER_DETAIL_RU: Record<string, string> = {
  'invalid email or password': 'Неправильный email или пароль',
  'email already registered': 'Этот email уже зарегистрирован',
  'refresh cookie missing': 'Сессия не найдена. Войдите ещё раз',
  'invalid refresh token': 'Сессия истекла. Войдите ещё раз',
  'refresh token expired': 'Сессия истекла. Войдите ещё раз',
  'employee no longer exists': 'Аккаунт удалён',
  'session terminated: refresh token reuse detected':
    'Сессия завершена из соображений безопасности. Войдите заново',
}

export class ApiError extends Error {
  status: number
  payload: unknown

  constructor(status: number, message: string, payload?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }

  /** Извлекает `detail` из ответа FastAPI и переводит на русский, если знаем. */
  get detail(): string {
    if (this.payload && typeof this.payload === 'object' && 'detail' in this.payload) {
      const raw = (this.payload as { detail: unknown }).detail
      if (typeof raw === 'string') return SERVER_DETAIL_RU[raw] ?? raw
    }
    return this.message
  }
}

function buildUrl(endpoint: string, query?: Record<string, unknown>): string {
  if (!query) return endpoint
  const qsStr = qs.stringify(query, { skipNulls: true, addQueryPrefix: true })
  return `${endpoint}${qsStr}`
}

function readAuthToken(): string | null {
  const raw = safeGetRaw(AUTH_TOKEN_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return typeof parsed === 'string' ? parsed : null
  } catch {
    return raw
  }
}

/** Single-flight ref: один общий promise на refresh для всех 401-ответов,
 *  пришедших одновременно. Сбрасывается после завершения. */
let refreshPromise: Promise<boolean> | null = null

interface RefreshSuccessShape {
  token: string
  user: unknown
}

async function performRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}${REFRESH_ENDPOINT}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) return false
    const body = (await res.json()) as RefreshSuccessShape
    if (!body?.token) return false
    safeSet(AUTH_TOKEN_STORAGE_KEY, body.token)
    if (body.user !== undefined) safeSet(AUTH_USER_STORAGE_KEY, body.user)
    return true
  } catch {
    return false
  }
}

function runSingleFlightRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise
  refreshPromise = performRefresh().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

/** Глобальное событие — слушает AuthStore, чтобы очистить локальное состояние
 *  и редиректнуть на /auth/login после неудачного refresh. */
function emitAuthLogout(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:logout'))
  }
}

async function doFetch(
  method: HttpMethod,
  path: string,
  options: ApiClientOptions
): Promise<Response> {
  const token = readAuthToken()
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  const baseHeaders: Record<string, string> = isFormData
    ? {}
    : { 'Content-Type': 'application/json' }

  return fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    headers: {
      ...baseHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: isFormData
      ? (options.body as FormData)
      : options.body
        ? JSON.stringify(options.body)
        : undefined,
    signal: options.signal,
  })
}

/** Стабильные id, чтобы N параллельных запросов не плодили дубликаты тостов. */
const TOAST_ID_NETWORK = 'api:network-down'
const TOAST_ID_SERVER_ERROR = 'api:server-error'

async function fetchWithNetworkFallback(
  method: HttpMethod,
  path: string,
  options: ApiClientOptions
): Promise<Response> {
  try {
    return await doFetch(method, path, options)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    toast.error('Нет соединения с сервером', { id: TOAST_ID_NETWORK })
    throw new ApiError(0, 'Network error', error)
  }
}

async function apiRequest(
  method: HttpMethod,
  endpoint: string,
  options: ApiClientOptions
): Promise<Response> {
  const path = buildUrl(endpoint, options.query)

  // Сам refresh-эндпоинт никогда не ретраим — иначе бесконечная рекурсия.
  const isRefreshCall = endpoint.startsWith(REFRESH_ENDPOINT)

  let res = await fetchWithNetworkFallback(method, path, options)

  if (res.status === 401 && !isRefreshCall) {
    const refreshed = await runSingleFlightRefresh()
    if (refreshed) {
      // Один retry с новым access-токеном.
      res = await fetchWithNetworkFallback(method, path, options)
    } else {
      // Refresh не помог — сбрасываем сессию.
      emitAuthLogout()
    }
  }

  if (!res.ok) {
    // 5xx — глобальный фоллбек: пользователь увидит, даже если стор-вызыватель
    // не обработает ошибку явно. 401 не трогаем (refresh-flow), 4xx остаются
    // на совести вызывателя (валидация, бизнес-правила).
    if (res.status >= 500) {
      toast.error('Сервер временно недоступен', { id: TOAST_ID_SERVER_ERROR })
    }
    let payload: unknown = null
    try {
      payload = await res.json()
    } catch {
      // ignore
    }
    throw new ApiError(res.status, `Request failed: ${res.status}`, payload)
  }

  return res
}

export async function apiClient<T>(
  method: HttpMethod,
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const res = await apiRequest(method, endpoint, options)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export async function apiClientWithMeta<T>(
  method: HttpMethod,
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<{ data: T; headers: Headers }> {
  const res = await apiRequest(method, endpoint, options)
  const data = res.status === 204 ? (undefined as T) : ((await res.json()) as T)
  return { data, headers: res.headers }
}
