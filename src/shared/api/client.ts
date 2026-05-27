import qs from 'qs'

import { API_BASE, USE_MOCKS } from '@/shared/config/env'
import { safeGetRaw } from '@/shared/lib/localStorage'

import { HttpMethod } from './apiUrls'
import { mockFetch } from './mockClient'

export interface ApiClientOptions {
  body?: unknown
  query?: Record<string, unknown>
  headers?: Record<string, string>
  signal?: AbortSignal
}

export const AUTH_TOKEN_STORAGE_KEY = 'auth.token'

export class ApiError extends Error {
  status: number
  payload: unknown

  constructor(status: number, message: string, payload?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
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

export async function apiClient<T>(
  method: HttpMethod,
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const path = buildUrl(endpoint, options.query)
  const token = readAuthToken()

  if (USE_MOCKS) {
    return mockFetch<T>(method, path, { body: options.body, token })
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  })

  if (!res.ok) {
    let payload: unknown = null
    try {
      payload = await res.json()
    } catch {
      // ignore
    }
    throw new ApiError(res.status, `Request failed: ${res.status}`, payload)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
