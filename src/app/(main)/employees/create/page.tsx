import { Metadata } from 'next'

import { HrGuard } from '@/widgets/AuthGuard'

import { CreateEmployeeClient } from './CreateEmployeeClient'

export const metadata: Metadata = {
  title: 'Добавить сотрудника · WorkTime Sync',
}

export const dynamic = 'force-static'

export default function CreateEmployeePage() {
  return (
    <HrGuard>
      <CreateEmployeeClient />
    </HrGuard>
  )
}
