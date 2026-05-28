import { Metadata } from 'next'

import { EmployeeRaw } from '@/entities/employee/model/types'
import { TeamRaw } from '@/entities/team/model/types'
import { serverFetch } from '@/shared/api/serverClient'
import { HrOrAnalystGuard } from '@/widgets/AuthGuard'

import { EmployeesPageClient } from './EmployeesPageClient'

export const metadata: Metadata = {
  title: 'Сотрудники · WorkTime Sync',
}

export const revalidate = 60

export default async function EmployeesPage() {
  const [employees, teams] = await Promise.all([
    serverFetch<EmployeeRaw[]>('GET', '/employees'),
    serverFetch<TeamRaw[]>('GET', '/teams'),
  ])

  return (
    <HrOrAnalystGuard>
      <EmployeesPageClient initialEmployees={employees} initialTeams={teams} />
    </HrOrAnalystGuard>
  )
}
