import { addDays, formatISO, startOfWeek } from 'date-fns'
import { makeAutoObservable, runInAction } from 'mobx'

import { getEmployees } from '@/entities/employee/api'
import { normalizeEmployee } from '@/entities/employee/lib/normalize'
import { Employee, EmployeeRaw } from '@/entities/employee/model/types'
import {
  getMeetingRecommendations,
  getTeam,
  getTeamAvailability,
  removeTeamMember,
} from '@/entities/team/api'
import {
  normalizeMeetingRecommendation,
  normalizeTeam,
  normalizeTeamAvailability,
} from '@/entities/team/lib/normalize'
import {
  MeetingRecommendation,
  MeetingRecommendationRaw,
  Team,
  TeamAvailability,
  TeamAvailabilityRaw,
  TeamRaw,
} from '@/entities/team/model/types'
import { LoadingStageModel, ValueModel } from '@/shared/model'

export interface TeamPageInitialData {
  team: TeamRaw
  availability: TeamAvailabilityRaw | null
  allEmployees: EmployeeRaw[]
  meetingRecommendations: MeetingRecommendationRaw[]
}

export class TeamPageStore {
  teamId: string
  team = new ValueModel<Team | null>(null)
  members = new ValueModel<Employee[]>([])
  availability = new ValueModel<TeamAvailability | null>(null)
  meetingRecommendations = new ValueModel<MeetingRecommendation[]>([])
  selectedWeekStart = new ValueModel<Date>(startOfWeek(new Date('2026-05-20'), { weekStartsOn: 1 }))
  selectedDaysCount = new ValueModel<number>(7)
  selectedHourRange = new ValueModel<[number, number]>([9, 18])
  heatmapMode = new ValueModel<'majority' | 'all'>('majority')
  excludedMemberIds = new ValueModel<Set<string>>(new Set())
  loadingStage = new LoadingStageModel()
  meetingLoadingStage = new LoadingStageModel()

  constructor(teamId: string, initial?: TeamPageInitialData) {
    this.teamId = teamId
    makeAutoObservable(this)
    if (initial) this.hydrate(initial)
  }

  /** Заполнить стор данными, полученными на сервере (SSR/ISR). Идемпотентно. */
  hydrate(initial: TeamPageInitialData): void {
    if (this.loadingStage.isSuccessful) return
    const team = normalizeTeam(initial.team)
    const memberIds = new Set(team.members.map((m) => m.employeeId))
    const members = initial.allEmployees.map(normalizeEmployee).filter((e) => memberIds.has(e.id))
    runInAction(() => {
      this.team.change(team)
      this.members.change(members)
      this.availability.change(
        initial.availability ? normalizeTeamAvailability(initial.availability) : null
      )
      this.loadingStage.success()
    })
    const recs = initial.meetingRecommendations.map(normalizeMeetingRecommendation)
    const filtered = this.filterRecommendations(recs)
    runInAction(() => {
      this.meetingRecommendations.change(filtered)
      this.meetingLoadingStage.success()
    })
  }

  shiftWeek(delta: -1 | 1): void {
    const next = addDays(this.selectedWeekStart.value, delta * 7)
    this.selectedWeekStart.change(next)
    void this.fetch()
  }

  setWeekToToday(): void {
    const next = startOfWeek(new Date(), { weekStartsOn: 1 })
    if (next.getTime() === this.selectedWeekStart.value.getTime()) return
    this.selectedWeekStart.change(next)
    void this.fetch()
  }

  toggleExcluded(employeeId: string): void {
    const next = new Set(this.excludedMemberIds.value)
    if (next.has(employeeId)) next.delete(employeeId)
    else next.add(employeeId)
    this.excludedMemberIds.change(next)
  }

  async removeMember(employeeId: string): Promise<boolean> {
    try {
      await removeTeamMember(this.teamId, employeeId)
      runInAction(() => {
        const team = this.team.value
        if (team) {
          this.team.change({
            ...team,
            members: team.members.filter((m) => m.employeeId !== employeeId),
          })
        }
        this.members.change(this.members.value.filter((m) => m.id !== employeeId))
        if (this.excludedMemberIds.value.has(employeeId)) {
          const next = new Set(this.excludedMemberIds.value)
          next.delete(employeeId)
          this.excludedMemberIds.change(next)
        }
      })
      return true
    } catch (error) {
      console.error('[TeamPageStore] removeMember failed', error)
      return false
    }
  }

  resetExcluded(): void {
    if (this.excludedMemberIds.value.size === 0) return
    this.excludedMemberIds.change(new Set())
  }

  async fetch(): Promise<void> {
    if (this.loadingStage.isLoading) return
    this.loadingStage.loading()
    try {
      const start = formatISO(this.selectedWeekStart.value)
      const end = formatISO(
        addDays(this.selectedWeekStart.value, Math.max(1, this.selectedDaysCount.value) - 1)
      )

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
