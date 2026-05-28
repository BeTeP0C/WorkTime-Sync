import { makeAutoObservable, runInAction } from 'mobx'
import { toast } from 'sonner'

import {
  completeVkLogin,
  getCurrentUser,
  login,
  logoutServerSession,
  refreshAuth,
  register,
} from '@/entities/auth/api'
import { LoginPayload, RegisterPayload, User } from '@/entities/auth/model/types'
import { AUTH_TOKEN_STORAGE_KEY, AUTH_USER_STORAGE_KEY } from '@/shared/api/client'
import { safeGet, safeRemove, safeSet } from '@/shared/lib/localStorage'
import { LoadingStageModel, ValueModel } from '@/shared/model'

/** За сколько мс до истечения access-токена запускаем proactive refresh. */
const PROACTIVE_REFRESH_LEAD_MS = 60_000
/** Минимальная задержка таймера — чтобы не зациклиться, если токен уже почти протух. */
const PROACTIVE_REFRESH_MIN_DELAY_MS = 5_000

function decodeAccessExpMs(token: string): number | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    const parsed = JSON.parse(payloadJson) as { exp?: unknown }
    return typeof parsed.exp === 'number' ? parsed.exp * 1000 : null
  } catch {
    return null
  }
}

export class AuthStore {
  currentUser = new ValueModel<User | null>(null)
  loadingStage = new LoadingStageModel()
  hydrationStage = new LoadingStageModel()

  private refreshTimerId: ReturnType<typeof setTimeout> | null = null
  /**
   * Single-flight для proactive refresh: если два триггера (таймер + 401-handler)
   * совпали по времени, второй ждёт результат первого, а не запускает второй
   * рефреш. Без этого в localStorage оказывался токен от более старого ответа.
   */
  private refreshInFlight: Promise<void> | null = null

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
    if (typeof window !== 'undefined') {
      window.addEventListener('auth:logout', this.handleAuthLogoutEvent)
    }
  }

  get isAuthenticated(): boolean {
    return this.currentUser.value !== null
  }

  get isHydrated(): boolean {
    return this.hydrationStage.isFinished
  }

  async hydrate(): Promise<void> {
    if (this.hydrationStage.isLoading || this.hydrationStage.isFinished) return
    this.hydrationStage.loading()

    const cachedUser = safeGet<User>(AUTH_USER_STORAGE_KEY)
    const token = safeGet<string>(AUTH_TOKEN_STORAGE_KEY)

    if (!token) {
      runInAction(() => {
        this.currentUser.change(null)
        this.hydrationStage.success()
      })
      return
    }

    if (cachedUser) {
      runInAction(() => this.currentUser.change(cachedUser))
    }

    try {
      const fresh = await getCurrentUser()
      runInAction(() => {
        this.currentUser.change(fresh)
        safeSet(AUTH_USER_STORAGE_KEY, fresh)
        this.hydrationStage.success()
      })
      this.scheduleProactiveRefresh(token)
    } catch (error) {
      console.warn('[AuthStore] hydrate failed, clearing session', error)
      this.clearSession()
      runInAction(() => this.hydrationStage.success())
    }
  }

  async login(payload: LoginPayload): Promise<void> {
    if (this.loadingStage.isLoading) return
    this.loadingStage.loading()
    try {
      const res = await login(payload)
      this.applyAuthResponse(res)
    } catch (error) {
      runInAction(() => this.loadingStage.error())
      throw error
    }
  }

  async loginWithVk(code: string): Promise<void> {
    if (this.loadingStage.isLoading) return
    this.loadingStage.loading()
    try {
      const res = await completeVkLogin(code)
      this.applyAuthResponse(res)
    } catch (error) {
      runInAction(() => this.loadingStage.error())
      throw error
    }
  }

  async register(payload: RegisterPayload): Promise<void> {
    if (this.loadingStage.isLoading) return
    this.loadingStage.loading()
    try {
      const res = await register(payload)
      this.applyAuthResponse(res)
    } catch (error) {
      runInAction(() => this.loadingStage.error())
      throw error
    }
  }

  async logout(): Promise<void> {
    try {
      await logoutServerSession()
    } catch (error) {
      console.warn('[AuthStore] server logout failed, cleaning local session anyway', error)
    }
    this.clearSession()
    toast.success('Вы вышли из аккаунта')
  }

  /** Proactive refresh: вызывается по таймеру за ~минуту до истечения access. */
  async refreshAccessToken(): Promise<void> {
    if (this.refreshInFlight) {
      return this.refreshInFlight
    }
    const promise = this.runRefresh().finally(() => {
      this.refreshInFlight = null
    })
    this.refreshInFlight = promise
    return promise
  }

  private async runRefresh(): Promise<void> {
    try {
      const res = await refreshAuth()
      runInAction(() => {
        safeSet(AUTH_TOKEN_STORAGE_KEY, res.token)
        safeSet(AUTH_USER_STORAGE_KEY, res.user)
        this.currentUser.change(res.user)
      })
      this.scheduleProactiveRefresh(res.token)
    } catch (error) {
      console.warn('[AuthStore] proactive refresh failed, clearing session', error)
      toast.error('Сессия истекла, войдите заново', { id: 'auth:session-expired' })
      this.clearSession()
    }
  }

  private applyAuthResponse(res: { token: string; user: User }): void {
    runInAction(() => {
      safeSet(AUTH_TOKEN_STORAGE_KEY, res.token)
      safeSet(AUTH_USER_STORAGE_KEY, res.user)
      this.currentUser.change(res.user)
      this.loadingStage.success()
    })
    this.scheduleProactiveRefresh(res.token)
  }

  private scheduleProactiveRefresh(token: string): void {
    this.cancelProactiveRefresh()
    if (typeof window === 'undefined') return
    const expMs = decodeAccessExpMs(token)
    if (expMs === null) return
    const delay = Math.max(
      expMs - Date.now() - PROACTIVE_REFRESH_LEAD_MS,
      PROACTIVE_REFRESH_MIN_DELAY_MS
    )
    this.refreshTimerId = setTimeout(() => {
      void this.refreshAccessToken()
    }, delay)
  }

  private cancelProactiveRefresh(): void {
    if (this.refreshTimerId !== null) {
      clearTimeout(this.refreshTimerId)
      this.refreshTimerId = null
    }
  }

  private handleAuthLogoutEvent = (): void => {
    this.clearSession()
  }

  private clearSession(): void {
    this.cancelProactiveRefresh()
    safeRemove(AUTH_TOKEN_STORAGE_KEY)
    safeRemove(AUTH_USER_STORAGE_KEY)
    runInAction(() => {
      this.currentUser.change(null)
      this.loadingStage.reset()
    })
  }

  /** Снять все window-listener'ы и таймеры. Вызывается из RootStore.dispose(). */
  dispose(): void {
    this.cancelProactiveRefresh()
    if (typeof window !== 'undefined') {
      window.removeEventListener('auth:logout', this.handleAuthLogoutEvent)
    }
  }
}
