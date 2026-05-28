import { Metadata } from 'next'

import { EmployeeRaw } from '@/entities/employee/model/types'
import { TeamRaw } from '@/entities/team/model/types'
import { serverFetch } from '@/shared/api/serverClient'

import { TeamsPageClient } from './TeamsPageClient'

export const metadata: Metadata = {
  title: 'Команды · WorkTime Sync',
}

export const revalidate = 60

export default async function TeamsPage() {
  const [teams, employees] = await Promise.all([
    serverFetch<TeamRaw[]>('GET', '/teams'),
    serverFetch<EmployeeRaw[]>('GET', '/employees'),
  ])

  return <TeamsPageClient initialTeams={teams} initialEmployees={employees} />
}
