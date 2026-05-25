import qs from 'qs'

import { API_BASE, USE_MOCKS } from '@/shared/config/env'

import { HttpMethod } from './apiUrls'
import { mockFetch } from './mockClient'

export interface ApiClientOptions {
  body?: unknown
  query?: Record<string, unknown>
  headers?: Record<string, string>
  signal?: AbortSignal
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
}

function buildUrl(endpoint: string, query?: Record<string, unknown>): string {
  if (!query) return endpoint
  const qsStr = qs.stringify(query, { skipNulls: true, addQueryPrefix: true })
  return `${endpoint}${qsStr}`
}

export async function apiClient<T>(
  method: HttpMethod,
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const path = buildUrl(endpoint, options.query)

  if (USE_MOCKS) {
    return mockFetch<T>(method, path)
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
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
