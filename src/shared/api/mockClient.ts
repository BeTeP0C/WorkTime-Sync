import { MOCK_DELAY_MS } from '@/shared/config/env'

import { HttpMethod } from './apiUrls'

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

const MOCKS_BASE = '/mocks'

/**
 * Маппит endpoint → путь к JSON-файлу в public/mocks.
 * Поддерживает динамические сегменты `:id` → читает соседний файл с подставленным id.
 */
function resolveMockPath(method: HttpMethod, endpoint: string): string | null {
  const path = endpoint.split('?')[0]

  // Точные совпадения для GET
  const exactMap: Record<string, string> = {
    'GET /dashboard/summary': `${MOCKS_BASE}/dashboard-summary.json`,
    'GET /employees': `${MOCKS_BASE}/employees.json`,
    'GET /teams': `${MOCKS_BASE}/teams.json`,
    'GET /recommendations': `${MOCKS_BASE}/recommendations.json`,
  }

  const exactKey = `${method} ${path}`
  if (exactMap[exactKey]) return exactMap[exactKey]

  // Динамические: /employees/{id}/...
  const employeeMatch = path.match(/^\/employees\/([^/]+)(\/.*)?$/)
  if (employeeMatch && method === 'GET') {
    const [, id, suffix = ''] = employeeMatch
    if (suffix === '') return `${MOCKS_BASE}/employees/${id}/profile.json`
    if (suffix === '/schedules/active') return `${MOCKS_BASE}/employees/${id}/schedule.json`
    if (suffix === '/exceptions') return `${MOCKS_BASE}/employees/${id}/exceptions.json`
    if (suffix === '/events') return `${MOCKS_BASE}/employees/${id}/events.json`
    if (suffix === '/recommendations') return `${MOCKS_BASE}/employees/${id}/recommendations.json`
  }

  // Динамические: /teams/{id}/...
  const teamMatch = path.match(/^\/teams\/([^/]+)(\/.*)?$/)
  if (teamMatch) {
    const [, id, suffix = ''] = teamMatch
    if (method === 'GET' && suffix === '') return `${MOCKS_BASE}/teams/${id}/profile.json`
    if (method === 'GET' && suffix === '/availability') {
      return `${MOCKS_BASE}/team-availability/${id}.json`
    }
    if (method === 'POST' && suffix === '/meeting-recommendations') {
      return `${MOCKS_BASE}/meeting-recommendations/${id}.json`
    }
  }

  return null
}

export async function mockFetch<T>(method: HttpMethod, endpoint: string): Promise<T> {
  const url = resolveMockPath(method, endpoint)

  if (!url) {
    console.warn(`[mockClient] No mock for ${method} ${endpoint}`)
    throw new Error(`Mock not found: ${method} ${endpoint}`)
  }

  await sleep(MOCK_DELAY_MS + Math.random() * 200)

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Failed to load mock ${url}: ${res.status}`)
  }

  return (await res.json()) as T
}
