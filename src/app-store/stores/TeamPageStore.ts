import { addDays, endOfWeek, formatISO, startOfWeek } from 'date-fns'
import { makeAutoObservable, runInAction } from 'mobx'

import { getEmployees } from '@/entities/employee/api'
import { Employee } from '@/entities/employee/model/types'
import { getMeetingRecommendations, getTeam, getTeamAvailability } from '@/entities/team/api'
import { MeetingRecommendation, Team, TeamAvailability } from '@/entities/team/model/types'
import { LoadingStageModel, ValueModel } from '@/shared/model'

export class TeamPageStore {
  teamId: string
  team = new ValueModel<Team | null>(null)
  members = new ValueModel<Employee[]>([])
  availability = new ValueModel<TeamAvailability | null>(null)
  meetingRecommendations = new ValueModel<MeetingRecommendation[]>([])
  selectedWeekStart = new ValueModel<Date>(startOfWeek(new Date('2026-05-20'), { weekStartsOn: 1 }))
  loadingStage = new LoadingStageModel()
  meetingLoadingStage = new LoadingStageModel()

  constructor(teamId: string) {
    this.teamId = teamId
    makeAutoObservable(this)
  }

  async fetch(): Promise<void> {
    if (this.loadingStage.isLoading) return
    this.loadingStage.loading()
    try {
      const start = formatISO(this.selectedWeekStart.value)
      const end = formatISO(endOfWeek(this.selectedWeekStart.value, { weekStartsOn: 1 }))

      const [team, availability, allEmployees] = await Promise.all([
        getTeam(this.teamId),
        getTeamAvailability(this.teamId, start, end).catch(() => null),
        getEmployees(),
      ])

      const memberIds = new Set(team.members.map((m) => m.employeeId))
      const members = allEmployees.filter((e) => memberIds.has(e.id))

      runInAction(() => {
        this.team.change(team)
        this.members.change(members)
        this.availability.change(availability)
        this.loadingStage.success()
      })

      await this.findMeeting()
    } catch (error) {
      console.error('[TeamPageStore] fetch failed', error)
      runInAction(() => this.loadingStage.error())
    }
  }

  async findMeeting(durationMinutes = 60): Promise<void> {
    this.meetingLoadingStage.loading()
    try {
      const start = formatISO(this.selectedWeekStart.value)
      const end = formatISO(addDays(this.selectedWeekStart.value, 5))
      const recs = await getMeetingRecommendations(this.teamId, {
        start_dt: start,
        end_dt: end,
        duration_minutes: durationMinutes,
      })

      const filtered = this.filterRecommendations(recs)
      runInAction(() => {
        this.meetingRecommendations.change(filtered)
        this.meetingLoadingStage.success()
      })
    } catch (error) {
      console.error('[TeamPageStore] findMeeting failed', error)
      runInAction(() => this.meetingLoadingStage.error())
    }
  }

  /**
   * Бизнес-логика приоритезации (см. план §5.2):
   * исключаем сотрудников с риском === 'critical' из available_employee_ids,
   * чтобы система не предлагала встречу с теми, чьи данные нельзя использовать.
   */
  private filterRecommendations(recs: MeetingRecommendation[]): MeetingRecommendation[] {
    const memberMetricMap = new Map<string, Employee>()
    for (const m of this.members.value) memberMetricMap.set(m.id, m)

    return recs.map((rec) => {
      const moved: string[] = []
      const stillAvailable = rec.availableEmployeeIds.filter((id) => {
        const member = memberMetricMap.get(id)
        if (member?.metric?.riskLevel === 'critical') {
          moved.push(id)
          return false
        }
        return true
      })

      const total = stillAvailable.length + rec.unavailableEmployeeIds.length + moved.length
      const score = total > 0 ? stillAvailable.length / total : 0

      return {
        ...rec,
        availableEmployeeIds: stillAvailable,
        unavailableEmployeeIds: [...rec.unavailableEmployeeIds, ...moved],
        score,
      }
    })
  }
}
