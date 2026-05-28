import { Metadata } from 'next'
import { endOfWeek, formatISO, startOfWeek } from 'date-fns'

import { TeamPageInitialData } from '@/app-store/stores/TeamPageStore'
import { EmployeeRaw } from '@/entities/employee/model/types'
import { MeetingRecommendationRaw, TeamAvailabilityRaw, TeamRaw } from '@/entities/team/model/types'
import { serverFetch } from '@/shared/api/serverClient'

import { TeamPageClient } from './TeamPageClient'

interface PageProps {
  params: { id: string }
}

export const revalidate = 60

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const team = await serverFetch<TeamRaw>('GET', `/teams/${params.id}`)
  return {
    title: team ? `${team.name} · WorkTime Sync` : 'Команда · WorkTime Sync',
  }
}

export default async function TeamPage({ params }: PageProps) {
  const weekStart = startOfWeek(new Date('2026-05-20'), { weekStartsOn: 1 })
  const start = formatISO(weekStart)
  const end = formatISO(endOfWeek(weekStart, { weekStartsOn: 1 }))

  const [team, availability, allEmployees, meetingRecommendations] = await Promise.all([
    serverFetch<TeamRaw>('GET', `/teams/${params.id}`),
    serverFetch<TeamAvailabilityRaw>('GET', `/teams/${params.id}/availability`, {
      query: { start_dt: start, end_dt: end },
    }),
    serverFetch<EmployeeRaw[]>('GET', '/employees'),
    serverFetch<MeetingRecommendationRaw[]>('POST', `/teams/${params.id}/meeting-recommendations`, {
      body: { start_dt: start, end_dt: end, duration_minutes: 60 },
    }),
  ])

  const initialData: TeamPageInitialData | null =
    team && allEmployees
      ? {
          team,
          availability,
          allEmployees,
          meetingRecommendations: meetingRecommendations ?? [],
        }
      : null

  return <TeamPageClient teamId={params.id} initialData={initialData} />
}
