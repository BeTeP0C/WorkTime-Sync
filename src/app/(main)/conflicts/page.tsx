import { Metadata } from 'next'

import { HrOrAnalystGuard } from '@/widgets/AuthGuard'

import { ConflictsPageClient } from './ConflictsPageClient'

export const metadata: Metadata = {
  title: 'Конфликты · WorkTime Sync',
}

export default function ConflictsPage() {
  return (
    <HrOrAnalystGuard>
      <ConflictsPageClient />
    </HrOrAnalystGuard>
  )
}
