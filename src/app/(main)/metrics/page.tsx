import { Metadata } from 'next'

import { DashboardSummaryRaw } from '@/entities/dashboard/model/types'
import { EmployeeRaw } from '@/entities/employee/model/types'
import { TeamRaw } from '@/entities/team/model/types'
import { serverFetch } from '@/shared/api/serverClient'
import { HrOrAnalystGuard } from '@/widgets/AuthGuard'

import { MetricsClient } from './MetricsClient'

export const metadata: Metadata = {
  title: 'Расчёт показателей · WorkTime Sync',
}

export const revalidate = 60

export default async function MetricsPage() {
  const [summary, employees, teams] = await Promise.all([
    serverFetch<DashboardSummaryRaw>('GET', '/dashboard/summary'),
    serverFetch<EmployeeRaw[]>('GET', '/employees'),
    serverFetch<TeamRaw[]>('GET', '/teams'),
  ])

  return (
    <HrOrAnalystGuard>
      <MetricsClient initialSummary={summary} initialEmployees={employees} initialTeams={teams} />
    </HrOrAnalystGuard>
  )
}
