import { Metadata } from 'next'

import { DashboardSummaryRaw } from '@/entities/dashboard/model/types'
import { EmployeeRaw } from '@/entities/employee/model/types'
import { serverFetch } from '@/shared/api/serverClient'

import { DashboardClient } from './DashboardClient'

export const metadata: Metadata = {
  title: 'Главная · WorkTime Sync',
}

export const revalidate = 60

export default async function DashboardPage() {
  const [summary, employees] = await Promise.all([
    serverFetch<DashboardSummaryRaw>('GET', '/dashboard/summary'),
    serverFetch<EmployeeRaw[]>('GET', '/employees'),
  ])

  return <DashboardClient initialSummary={summary} initialEmployees={employees} />
}
