import { makeAutoObservable, runInAction } from 'mobx'

import { getTeams } from '@/entities/team/api'
import { Team } from '@/entities/team/model/types'
import { ListModel } from '@/shared/model'

export class TeamsStore {
  list = new ListModel<Team, string>({ keys: [], entities: new Map() })

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

  getTeam(id: string): Team | null {
    return this.list.getEntity(id)
  }
}
