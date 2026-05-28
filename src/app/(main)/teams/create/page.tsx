import { Metadata } from 'next'

import { HrGuard } from '@/widgets/AuthGuard'

import { CreateTeamClient } from './CreateTeamClient'

export const metadata: Metadata = {
  title: 'Создание команды · WorkTime Sync',
}

export const dynamic = 'force-static'

export default function CreateTeamPage() {
  return (
    <HrGuard>
      <CreateTeamClient />
    </HrGuard>
  )
}
