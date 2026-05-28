import { API_URLS } from '@/shared/api/apiUrls'
import { apiClient } from '@/shared/api/client'

import {
  normalizeMeetingRecommendation,
  normalizeTeam,
  normalizeTeamAvailability,
  normalizeTeamMetrics,
} from '../lib/normalize'
import {
  CreateTeamPayload,
  MeetingRecommendation,
  MeetingRecommendationRaw,
  Team,
  TeamAvailability,
  TeamAvailabilityRankingItem,
  TeamAvailabilityRankingItemRaw,
  TeamAvailabilityRaw,
  TeamMetrics,
  TeamMetricsRaw,
  TeamRaw,
} from '../model/types'

export async function getTeams(): Promise<Team[]> {
  const data = await apiClient<TeamRaw[]>('GET', API_URLS.teams())
  return data.map(normalizeTeam)
}

export async function getTeam(id: string): Promise<Team> {
  const data = await apiClient<TeamRaw>('GET', API_URLS.team(id))
  return normalizeTeam(data)
}

export async function getTeamAvailability(
  id: string,
  startDt: string,
  endDt: string
): Promise<TeamAvailability> {
  const data = await apiClient<TeamAvailabilityRaw>('GET', API_URLS.teamAvailability(id), {
    query: { start_dt: startDt, end_dt: endDt },
  })
  return normalizeTeamAvailability(data)
}

export async function getTeamMetrics(id: string): Promise<TeamMetrics> {
  const data = await apiClient<TeamMetricsRaw>('GET', API_URLS.teamMetrics(id))
  return normalizeTeamMetrics(data)
}

export async function getTeamAvailabilityRanking(
  windowDays = 7
): Promise<TeamAvailabilityRankingItem[]> {
  const data = await apiClient<TeamAvailabilityRankingItemRaw[]>(
    'GET',
    API_URLS.teamAvailabilityRanking(),
    { query: { window_days: String(windowDays) } }
  )
  return data.map(
    (raw): TeamAvailabilityRankingItem => ({
      teamId: raw.team_id,
      name: raw.name,
      membersCount: raw.members_count,
      overlapRatio: raw.overlap_ratio,
      fullTeamMinutes: raw.full_team_minutes,
      majorityMinutes: raw.majority_minutes,
      totalWindowMinutes: raw.total_window_minutes,
    })
  )
}

export async function createTeam(payload: CreateTeamPayload): Promise<Team> {
  const data = await apiClient<TeamRaw>('POST', API_URLS.teams(), {
    body: {
      name: payload.name,
      description: payload.description,
      avatar_url: payload.avatarUrl,
      members: payload.members.map((m) => ({
        employee_id: m.employeeId,
        role_in_team: m.role,
      })),
    },
  })
  return normalizeTeam(data)
}

export async function getMeetingRecommendations(
  id: string,
  payload: { start_dt: string; end_dt: string; duration_minutes: number }
): Promise<MeetingRecommendation[]> {
  const data = await apiClient<MeetingRecommendationRaw[]>(
    'POST',
    API_URLS.teamMeetingRecommendations(id),
    { body: payload }
  )
  return data.map(normalizeMeetingRecommendation)
}

export async function deleteTeam(id: string): Promise<void> {
  await apiClient<void>('DELETE', API_URLS.team(id))
}

export async function removeTeamMember(teamId: string, employeeId: string): Promise<void> {
  await apiClient<void>('DELETE', API_URLS.teamMember(teamId, employeeId))
}
