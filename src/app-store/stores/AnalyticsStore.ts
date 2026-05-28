import { makeAutoObservable, observable, runInAction } from 'mobx'

import {
  getActualityHistory,
  getRiskDistributionHistory,
  getTeamMetricsHistory,
  getTeamRating,
} from '@/entities/analytics/api'
import {
  ActualityHistoryPoint,
  RiskDistributionPoint,
  TeamMetricsHistoryPoint,
  TeamRatingItem,
} from '@/entities/analytics/model/types'
import { LoadingStageModel } from '@/shared/model'

export class AnalyticsStore {
  actualityHistory: ActualityHistoryPoint[] = []
  actualityHistoryStage = new LoadingStageModel()

  riskDistributionHistory: RiskDistributionPoint[] = []
  riskDistributionHistoryStage = new LoadingStageModel()

  teamRating: TeamRatingItem[] = []
  teamRatingStage = new LoadingStageModel()

  /** Кеш по teamId: чтобы не повторять запрос при возвращении к команде. */
  teamMetricsHistoryByTeamId = observable.map<string, TeamMetricsHistoryPoint[]>()
  teamMetricsHistoryStageByTeamId = observable.map<string, LoadingStageModel>()

  constructor() {
    makeAutoObservable(this)
  }

  async fetchActualityHistory(months = 6): Promise<void> {
    if (this.actualityHistoryStage.isLoading) return
    this.actualityHistoryStage.loading()
    try {
      const data = await getActualityHistory(months)
      runInAction(() => {
        this.actualityHistory = data
        this.actualityHistoryStage.success()
      })
    } catch (error) {
      console.error('[AnalyticsStore] fetchActualityHistory failed', error)
      runInAction(() => this.actualityHistoryStage.error())
    }
  }

  async fetchRiskDistributionHistory(months = 6): Promise<void> {
    if (this.riskDistributionHistoryStage.isLoading) return
    this.riskDistributionHistoryStage.loading()
    try {
      const data = await getRiskDistributionHistory(months)
      runInAction(() => {
        this.riskDistributionHistory = data
        this.riskDistributionHistoryStage.success()
      })
    } catch (error) {
      console.error('[AnalyticsStore] fetchRiskDistributionHistory failed', error)
      runInAction(() => this.riskDistributionHistoryStage.error())
    }
  }

  async fetchTeamRating(limit = 10): Promise<void> {
    if (this.teamRatingStage.isLoading) return
    this.teamRatingStage.loading()
    try {
      const data = await getTeamRating(limit)
      runInAction(() => {
        this.teamRating = data
        this.teamRatingStage.success()
      })
    } catch (error) {
      console.error('[AnalyticsStore] fetchTeamRating failed', error)
      runInAction(() => this.teamRatingStage.error())
    }
  }

  getTeamMetricsHistory(teamId: string | null): TeamMetricsHistoryPoint[] {
    if (!teamId) return []
    return this.teamMetricsHistoryByTeamId.get(teamId) ?? []
  }

  getTeamMetricsHistoryStage(teamId: string | null): LoadingStageModel | null {
    if (!teamId) return null
    return this.teamMetricsHistoryStageByTeamId.get(teamId) ?? null
  }

  async fetchTeamMetricsHistory(teamId: string, months = 6): Promise<void> {
    let stage = this.teamMetricsHistoryStageByTeamId.get(teamId)
    if (!stage) {
      stage = new LoadingStageModel()
      this.teamMetricsHistoryStageByTeamId.set(teamId, stage)
    }
    if (stage.isLoading) return
    stage.loading()
    try {
      const data = await getTeamMetricsHistory(teamId, months)
      runInAction(() => {
        this.teamMetricsHistoryByTeamId.set(teamId, data)
        stage!.success()
      })
    } catch (error) {
      console.error('[AnalyticsStore] fetchTeamMetricsHistory failed', error)
      runInAction(() => stage!.error())
    }
  }
}
