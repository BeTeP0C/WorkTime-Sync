'use client'

import { observer } from 'mobx-react-lite'

import { useAuthStore } from '@/app-store/context'
import { isManagementRole } from '@/entities/auth/model/types'
import { DashboardSummaryRaw } from '@/entities/dashboard/model/types'
import { EmployeeRaw } from '@/entities/employee/model/types'

import { EmployeeDashboardClient } from './EmployeeDashboardClient'
import { HrDashboardClient } from './HrDashboardClient'

interface DashboardClientProps {
  initialSummary: DashboardSummaryRaw | null
  initialEmployees: EmployeeRaw[] | null
}

export const DashboardClient = observer(function DashboardClient({
  initialSummary,
  initialEmployees,
}: DashboardClientProps) {
  const auth = useAuthStore()
  const role = auth.currentUser.value?.role

  if (isManagementRole(role)) {
    return <HrDashboardClient initialSummary={initialSummary} initialEmployees={initialEmployees} />
  }
  const userId = auth.currentUser.value?.id
  if (!userId) return null
  return <EmployeeDashboardClient userId={userId} />
})
