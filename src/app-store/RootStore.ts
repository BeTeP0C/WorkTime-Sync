import { makeAutoObservable } from 'mobx'

import { AuthStore } from './stores/AuthStore'
import { DashboardStore } from './stores/DashboardStore'
import { EmployeesStore } from './stores/EmployeesStore'
import { TeamsStore } from './stores/TeamsStore'

/**
 * Глобальные сторы (живут всё время сессии): AuthStore, EmployeesStore, TeamsStore, DashboardStore.
 * Page-scoped сторы (EmployeeProfileStore, TeamPageStore) создаются на странице
 * и не входят в RootStore — они привязаны к конкретному URL.
 */
export class RootStore {
  authStore: AuthStore
  employeesStore: EmployeesStore
  teamsStore: TeamsStore
  dashboardStore: DashboardStore

  constructor() {
    this.authStore = new AuthStore()
    this.employeesStore = new EmployeesStore()
    this.teamsStore = new TeamsStore()
    this.dashboardStore = new DashboardStore()

    makeAutoObservable(this)
  }
}
