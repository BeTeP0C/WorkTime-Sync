import { makeAutoObservable, runInAction } from 'mobx'

import { getCurrentUser, login, register } from '@/entities/auth/api'
import { LoginPayload, RegisterPayload, User } from '@/entities/auth/model/types'
import { AUTH_TOKEN_STORAGE_KEY } from '@/shared/api/client'
import { safeGet, safeRemove, safeSet } from '@/shared/lib/localStorage'
import { LoadingStageModel, ValueModel } from '@/shared/model'

const AUTH_USER_STORAGE_KEY = 'auth.user'

export class AuthStore {
  currentUser = new ValueModel<User | null>(null)
  loadingStage = new LoadingStageModel()
  hydrationStage = new LoadingStageModel()

  constructor() {
    makeAutoObservable(this)
  }

  get isAuthenticated(): boolean {
    return this.currentUser.value !== null
  }

  get isHydrated(): boolean {
    return this.hydrationStage.isFinished
  }

  /**
   * Восстанавливает сессию из localStorage. Если есть токен — пробует получить актуальный
   * профиль с бэка; при ошибке сбрасывает локальное состояние.
   */
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
      runInAction(() => {
        safeSet(AUTH_TOKEN_STORAGE_KEY, res.token)
        safeSet(AUTH_USER_STORAGE_KEY, res.user)
        this.currentUser.change(res.user)
        this.loadingStage.success()
      })
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
      runInAction(() => {
        safeSet(AUTH_TOKEN_STORAGE_KEY, res.token)
        safeSet(AUTH_USER_STORAGE_KEY, res.user)
        this.currentUser.change(res.user)
        this.loadingStage.success()
      })
    } catch (error) {
      runInAction(() => this.loadingStage.error())
      throw error
    }
  }

  logout(): void {
    this.clearSession()
  }

  private clearSession(): void {
    safeRemove(AUTH_TOKEN_STORAGE_KEY)
    safeRemove(AUTH_USER_STORAGE_KEY)
    runInAction(() => {
      this.currentUser.change(null)
      this.loadingStage.reset()
    })
  }
}
