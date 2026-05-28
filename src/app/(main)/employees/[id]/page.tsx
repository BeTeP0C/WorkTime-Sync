import { Metadata } from 'next'

import { EmployeeProfileInitialData } from '@/app-store/stores/EmployeeProfileStore'
import { EmployeeRaw } from '@/entities/employee/model/types'
import { ScheduleExceptionRaw } from '@/entities/exception/model/types'
import { RecommendationRaw } from '@/entities/recommendation/model/types'
import { WorkScheduleRaw } from '@/entities/schedule/model/types'
import { serverFetch } from '@/shared/api/serverClient'
import { SelfOrHrGuard } from '@/widgets/AuthGuard'

import { EmployeeProfileClient } from './EmployeeProfileClient'

interface PageProps {
  params: { id: string }
}

export const revalidate = 60

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const employee = await serverFetch<EmployeeRaw>('GET', `/employees/${params.id}`)
  return {
    title: employee ? `${employee.full_name} · WorkTime Sync` : 'Сотрудник · WorkTime Sync',
  }
}

export default async function EmployeeProfilePage({ params }: PageProps) {
  const [employee, schedule, exceptions, recommendations] = await Promise.all([
    serverFetch<EmployeeRaw>('GET', `/employees/${params.id}`),
    serverFetch<WorkScheduleRaw>('GET', `/employees/${params.id}/schedules/active`),
    serverFetch<ScheduleExceptionRaw[]>('GET', `/employees/${params.id}/exceptions`),
    serverFetch<RecommendationRaw[]>('GET', `/employees/${params.id}/recommendations`),
  ])

  const initialData: EmployeeProfileInitialData | null = employee
    ? {
        employee,
        schedule,
        exceptions: exceptions ?? [],
        recommendations: recommendations ?? [],
      }
    : null

  return (
    <SelfOrHrGuard employeeId={params.id}>
      <EmployeeProfileClient employeeId={params.id} initialData={initialData} />
    </SelfOrHrGuard>
  )
}
