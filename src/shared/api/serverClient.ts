import 'server-only'

import qs from 'qs'

import { SERVER_API_BASE } from '@/shared/config/env'

import { HttpMethod } from './apiUrls'

export interface ServerFetchOptions {
  query?: Record<string, unknown>
  body?: unknown
  /**
   * Период ревалидации для ISR (в секундах).
   * `false` — без ревалидации; `0` — всегда свежий (SSR без кэша).
   */
  revalidate?: number | false
}

function buildPathWithQuery(endpoint: string, query?: Record<string, unknown>): string {
  if (!query) return endpoint
  const qsStr = qs.stringify(query, { skipNulls: true, addQueryPrefix: true })
  return `${endpoint}${qsStr}`
}

/**
 * Серверный fetch для использования в Server Components / Route Handlers.
 *
 * Делает запрос к API с поддержкой Next.js ISR (`next.revalidate`).
 * При ошибке возвращает `null` — страница должна корректно отрендериться без
 * предзагруженных данных, а клиент дозагрузит их на гидратации.
 */
export async function serverFetch<T>(
  method: HttpMethod,
  endpoint: string,
  options: ServerFetchOptions = {}
): Promise<T | null> {
  const pathWithQuery = buildPathWithQuery(endpoint, options.query)
  try {
    const res = await fetch(`${SERVER_API_BASE}${pathWithQuery}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: options.body ? JSON.stringify(options.body) : undefined,
      next: options.revalidate === false ? undefined : { revalidate: options.revalidate ?? 60 },
    })
    if (!res.ok) return null
    if (res.status === 204) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}
