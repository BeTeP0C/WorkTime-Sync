import { makeAutoObservable } from 'mobx'

import { DashboardStore } from './stores/DashboardStore'
import { EmployeesStore } from './stores/EmployeesStore'
import { TeamsStore } from './stores/TeamsStore'

/**
 * Глобальные сторы (живут всё время сессии): EmployeesStore, TeamsStore, DashboardStore.
 * Page-scoped сторы (EmployeeProfileStore, TeamPageStore) создаются на странице
 * и не входят в RootStore — они привязаны к конкретному URL.
 */
export class RootStore {
  employeesStore: EmployeesStore
  teamsStore: TeamsStore
  dashboardStore: DashboardStore

  constructor() {
    this.employeesStore = new EmployeesStore()
    this.teamsStore = new TeamsStore()
    this.dashboardStore = new DashboardStore()

    makeAutoObservable(this)
  }
}
