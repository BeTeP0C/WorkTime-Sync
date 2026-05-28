import { Metadata } from 'next'

import { EmployeeRaw } from '@/entities/employee/model/types'
import { TeamRaw } from '@/entities/team/model/types'
import { serverFetch } from '@/shared/api/serverClient'
import { HrOrAnalystGuard } from '@/widgets/AuthGuard'

import { DiagnosticsClient } from './DiagnosticsClient'

export const metadata: Metadata = {
  title: 'Диагностика · WorkTime Sync',
}

export const revalidate = 60

export default async function DiagnosticsPage() {
  const [employees, teams] = await Promise.all([
    serverFetch<EmployeeRaw[]>('GET', '/employees'),
    serverFetch<TeamRaw[]>('GET', '/teams'),
  ])

  return (
    <HrOrAnalystGuard>
      <DiagnosticsClient initialEmployees={employees} initialTeams={teams} />
    </HrOrAnalystGuard>
  )
}
