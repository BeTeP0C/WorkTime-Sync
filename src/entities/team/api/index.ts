import { API_URLS } from '@/shared/api/apiUrls'
import { apiClient } from '@/shared/api/client'

import {
  normalizeMeetingRecommendation,
  normalizeTeam,
  normalizeTeamAvailability,
} from '../lib/normalize'
import {
  MeetingRecommendation,
  MeetingRecommendationRaw,
  Team,
  TeamAvailability,
  TeamAvailabilityRaw,
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
