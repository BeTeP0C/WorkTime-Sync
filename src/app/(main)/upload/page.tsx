import { Metadata } from 'next'

import { HrGuard } from '@/widgets/AuthGuard'

import { UploadClient } from './UploadClient'

export const metadata: Metadata = {
  title: 'Загрузка данных · WorkTime Sync',
}

export default function UploadPage() {
  return (
    <HrGuard>
      <UploadClient />
    </HrGuard>
  )
}
