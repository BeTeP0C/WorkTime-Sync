import { makeAutoObservable, runInAction } from 'mobx'

import { getEmployee } from '@/entities/employee/api'
import { Employee } from '@/entities/employee/model/types'
import { getEmployeeExceptions } from '@/entities/exception/api'
import { ScheduleException } from '@/entities/exception/model/types'
import { getEmployeeRecommendations } from '@/entities/recommendation/api'
import { Recommendation } from '@/entities/recommendation/model/types'
import { getEmployeeActiveSchedule } from '@/entities/schedule/api'
import { WorkSchedule } from '@/entities/schedule/model/types'
import { LoadingStageModel, ValueModel } from '@/shared/model'

export class EmployeeProfileStore {
  employeeId: string
  employee = new ValueModel<Employee | null>(null)
  schedule = new ValueModel<WorkSchedule | null>(null)
  exceptions = new ValueModel<ScheduleException[]>([])
  recommendations = new ValueModel<Recommendation[]>([])
  loadingStage = new LoadingStageModel()

  constructor(employeeId: string) {
    this.employeeId = employeeId
    makeAutoObservable(this)
  }

  async fetch(): Promise<void> {
    if (this.loadingStage.isLoading) return
    this.loadingStage.loading()
    try {
      const [employee, schedule, exceptions, recommendations] = await Promise.all([
        getEmployee(this.employeeId),
        getEmployeeActiveSchedule(this.employeeId).catch(() => null),
        getEmployeeExceptions(this.employeeId).catch(() => []),
        getEmployeeRecommendations(this.employeeId).catch(() => []),
      ])
      runInAction(() => {
        this.employee.change(employee)
        this.schedule.change(schedule)
        this.exceptions.change(exceptions)
        this.recommendations.change(recommendations)
        this.loadingStage.success()
      })
    } catch (error) {
      console.error('[EmployeeProfileStore] fetch failed', error)
      runInAction(() => this.loadingStage.error())
    }
  }
}
