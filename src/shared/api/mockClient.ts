import { MOCK_DELAY_MS } from '@/shared/config/env'
import { safeGet, safeSet } from '@/shared/lib/localStorage'

import { ApiError } from './client'
import { HttpMethod } from './apiUrls'

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

const MOCKS_BASE = '/mocks'

const AUTH_USERS_STORAGE_KEY = 'auth.users'

interface MockUser {
  id: string
  email: string
  password: string
  fullName: string
  role: 'manager' | 'employee'
  initials: string
}

interface PublicUser {
  id: string
  email: string
  fullName: string
  role: 'manager' | 'employee'
  initials: string
}

const DEFAULT_USER: MockUser = {
  id: 'usr-default',
  email: 'admin@worktime.sync',
  password: 'admin123',
  fullName: 'Алексей Иванов',
  role: 'manager',
  initials: 'АИ',
}

function toPublicUser(user: MockUser): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...rest } = user
  return rest
}

function readStoredUsers(): MockUser[] {
  const data = safeGet<MockUser[]>(AUTH_USERS_STORAGE_KEY)
  return Array.isArray(data) ? data : []
}

function writeStoredUsers(users: MockUser[]): void {
  safeSet(AUTH_USERS_STORAGE_KEY, users)
}

function allUsers(): MockUser[] {
  return [DEFAULT_USER, ...readStoredUsers()]
}

function makeInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function makeToken(userId: string): string {
  const payload = {
    userId,
    exp: Date.now() + 24 * 60 * 60 * 1000,
  }
  const payloadB64 = typeof btoa === 'function'
    ? btoa(JSON.stringify(payload))
    : Buffer.from(JSON.stringify(payload)).toString('base64')
  return `mock.${payloadB64}.sig`
}

function parseToken(token: string | undefined): { userId: string; exp: number } | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3 || parts[0] !== 'mock') return null
  try {
    const raw = typeof atob === 'function'
      ? atob(parts[1])
      : Buffer.from(parts[1], 'base64').toString('utf-8')
    const data = JSON.parse(raw)
    if (typeof data.userId !== 'string' || typeof data.exp !== 'number') return null
    if (data.exp < Date.now()) return null
    return data
  } catch {
    return null
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface MockFetchOptions {
  body?: unknown
  token?: string | null
}

async function handleAuthRoute<T>(
  method: HttpMethod,
  path: string,
  options: MockFetchOptions
): Promise<T | null> {
  if (method === 'POST' && path === '/auth/login') {
    const body = (options.body ?? {}) as { email?: string; password?: string }
    const email = (body.email ?? '').trim().toLowerCase()
    const password = body.password ?? ''
    if (!email || !password) {
      throw new ApiError(400, 'Email и пароль обязательны')
    }
    const user = allUsers().find((u) => u.email.toLowerCase() === email)
    if (!user || user.password !== password) {
      throw new ApiError(401, 'Неверный email или пароль')
    }
    return { token: makeToken(user.id), user: toPublicUser(user) } as T
  }

  if (method === 'POST' && path === '/auth/register') {
    const body = (options.body ?? {}) as {
      email?: string
      password?: string
      fullName?: string
    }
    const email = (body.email ?? '').trim().toLowerCase()
    const password = body.password ?? ''
    const fullName = (body.fullName ?? '').trim()
    if (!email || !password || !fullName) {
      throw new ApiError(400, 'Все поля обязательны')
    }
    if (!EMAIL_RE.test(email)) {
      throw new ApiError(400, 'Некорректный email')
    }
    if (password.length < 6) {
      throw new ApiError(400, 'Пароль должен быть не короче 6 символов')
    }
    if (allUsers().some((u) => u.email.toLowerCase() === email)) {
      throw new ApiError(409, 'Пользователь с таким email уже существует')
    }
    const newUser: MockUser = {
      id: `usr-${Math.random().toString(36).slice(2, 10)}`,
      email,
      password,
      fullName,
      role: 'employee',
      initials: makeInitials(fullName),
    }
    const stored = readStoredUsers()
    stored.push(newUser)
    writeStoredUsers(stored)
    return { token: makeToken(newUser.id), user: toPublicUser(newUser) } as T
  }

  if (method === 'GET' && path === '/auth/me') {
    const decoded = parseToken(options.token ?? undefined)
    if (!decoded) {
      throw new ApiError(401, 'Не авторизовано')
    }
    const user = allUsers().find((u) => u.id === decoded.userId)
    if (!user) {
      throw new ApiError(401, 'Пользователь не найден')
    }
    return toPublicUser(user) as T
  }

  return null
}

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

export async function mockFetch<T>(
  method: HttpMethod,
  endpoint: string,
  options: MockFetchOptions = {}
): Promise<T> {
  const path = endpoint.split('?')[0]

  await sleep(MOCK_DELAY_MS + Math.random() * 200)

  // Сначала проверяем auth-роуты (in-memory обработка)
  if (path.startsWith('/auth/')) {
    const result = await handleAuthRoute<T>(method, path, options)
    if (result !== null) return result
    throw new ApiError(404, `Mock auth route not found: ${method} ${path}`)
  }

  const url = resolveMockPath(method, endpoint)

  if (!url) {
    console.warn(`[mockClient] No mock for ${method} ${endpoint}`)
    throw new Error(`Mock not found: ${method} ${endpoint}`)
  }

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Failed to load mock ${url}: ${res.status}`)
  }

  return (await res.json()) as T
}
