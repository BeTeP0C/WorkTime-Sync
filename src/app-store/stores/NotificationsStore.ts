import { makeAutoObservable, runInAction } from 'mobx'

import {
  confirmEmployeeSchedule,
  declineConfirmationRequest,
  getConfirmationRequests,
} from '@/entities/confirmation/api'
import { ScheduleConfirmationRequest } from '@/entities/confirmation/model/types'
import { LoadingStageModel, ValueModel } from '@/shared/model'

export class NotificationsStore {
  requests = new ValueModel<ScheduleConfirmationRequest[]>([])
  loadingStage = new LoadingStageModel()

  constructor() {
    makeAutoObservable(this)
  }

  get pendingCount(): number {
    return this.requests.value.filter((r) => r.status === 'pending').length
  }

  async loadForCurrentUser(userId: string): Promise<void> {
    if (this.loadingStage.isLoading) return
    this.loadingStage.loading()
    try {
      const requests = await getConfirmationRequests(userId, 'pending')
      runInAction(() => {
        this.requests.change(requests)
        this.loadingStage.success()
      })
    } catch (error) {
      console.error('[NotificationsStore] loadForCurrentUser failed', error)
      runInAction(() => this.loadingStage.error())
    }
  }

  async confirm(userId: string): Promise<void> {
    try {
      const result = await confirmEmployeeSchedule(userId)
      const closed = new Set(result.closedRequestIds)
      runInAction(() => {
        this.requests.change(
          this.requests.value.map((r) =>
            closed.has(r.id) ? { ...r, status: 'confirmed', respondedAt: result.confirmedAt } : r
          )
        )
      })
    } catch (error) {
      console.error('[NotificationsStore] confirm failed', error)
    }
  }

  async decline(userId: string, requestId: string, note: string | null): Promise<void> {
    try {
      const updated = await declineConfirmationRequest(userId, requestId, note)
      runInAction(() => {
        this.requests.change(this.requests.value.map((r) => (r.id === updated.id ? updated : r)))
      })
    } catch (error) {
      console.error('[NotificationsStore] decline failed', error)
    }
  }
}
