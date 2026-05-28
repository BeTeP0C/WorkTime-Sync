'use client'

import { AppHeader } from '@/widgets/AppHeader'
import { DataUploader } from '@/widgets/DataUploader'

export function UploadClient() {
  return (
    <>
      <AppHeader title="Загрузка данных" />
      <DataUploader />
    </>
  )
}
