import { makeAutoObservable, runInAction } from 'mobx'

import { createTeam, deleteTeam, getTeamMetrics, getTeams } from '@/entities/team/api'
import { normalizeTeam } from '@/entities/team/lib/normalize'
import { CreateTeamPayload, Team, TeamMetrics, TeamRaw } from '@/entities/team/model/types'
import { ListModel } from '@/shared/model'

export class TeamsStore {
  list = new ListModel<Team, string>({ keys: [], entities: new Map() })
  metricsByTeamId = new Map<string, TeamMetrics>()

  constructor() {
    makeAutoObservable(this)
  }

  async fetch(): Promise<void> {
    if (this.list.loadingStage.isLoading) return
    this.list.loadingStage.loading()
    try {
      const data = await getTeams()
      runInAction(() => {
        this.list.fillByRawData(data, (raw) => ({ entity: raw, key: raw.id }), true)
        this.list.loadingStage.success()
      })
    } catch (error) {
      console.error('[TeamsStore] fetch failed', error)
      runInAction(() => this.list.loadingStage.error())
    }
  }

  async fetchMetrics(teamId: string): Promise<TeamMetrics | null> {
    try {
      const metrics = await getTeamMetrics(teamId)
      runInAction(() => {
        this.metricsByTeamId.set(teamId, metrics)
      })
      return metrics
    } catch (error) {
      console.error('[TeamsStore] fetchMetrics failed', teamId, error)
      return null
    }
  }

  getMetrics(teamId: string): TeamMetrics | null {
    return this.metricsByTeamId.get(teamId) ?? null
  }

  async create(payload: CreateTeamPayload): Promise<Team> {
    const team = await createTeam(payload)
    runInAction(() => {
      this.list.addEntity({ entity: team, key: team.id, start: true })
    })
    return team
  }

  async delete(teamId: string): Promise<boolean> {
    try {
      await deleteTeam(teamId)
      runInAction(() => {
        this.list.removeEntity(teamId)
        this.metricsByTeamId.delete(teamId)
      })
      return true
    } catch (error) {
      console.error('[TeamsStore] delete failed', error)
      return false
    }
  }

  getTeam(id: string): Team | null {
    return this.list.getEntity(id)
  }

  /** Заполнить стор данными, полученными на сервере (SSR/ISR). Идемпотентно. */
  hydrate(raw: TeamRaw[]): void {
    if (this.list.loadingStage.isSuccessful) return
    const teams = raw.map(normalizeTeam)
    runInAction(() => {
      this.list.fillByRawData(teams, (t) => ({ entity: t, key: t.id }), true)
      this.list.loadingStage.success()
    })
  }
}
