import { makeAutoObservable } from 'mobx'

import { AnalyticsStore } from './stores/AnalyticsStore'
import { AuthStore } from './stores/AuthStore'
import { ConflictsStore } from './stores/ConflictsStore'
import { DashboardStore } from './stores/DashboardStore'
import { EmployeesStore } from './stores/EmployeesStore'
import { NotificationsStore } from './stores/NotificationsStore'
import { RecommendationsStore } from './stores/RecommendationsStore'
import { RoadmapStore } from './stores/RoadmapStore'
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
  analyticsStore: AnalyticsStore
  recommendationsStore: RecommendationsStore
  notificationsStore: NotificationsStore
  roadmapStore: RoadmapStore
  conflictsStore: ConflictsStore

  constructor() {
    this.authStore = new AuthStore()
    this.employeesStore = new EmployeesStore()
    this.teamsStore = new TeamsStore()
    this.dashboardStore = new DashboardStore()
    this.analyticsStore = new AnalyticsStore()
    this.recommendationsStore = new RecommendationsStore()
    this.notificationsStore = new NotificationsStore()
    this.roadmapStore = new RoadmapStore()
    this.conflictsStore = new ConflictsStore()

    makeAutoObservable(this)
  }
}
