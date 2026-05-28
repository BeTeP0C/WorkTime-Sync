import { Metadata } from 'next'

import { OfflineClient } from './OfflineClient'

export const metadata: Metadata = {
  title: 'Нет связи · WorkTime Sync',
}

export const dynamic = 'force-static'

export default function OfflinePage() {
  return <OfflineClient />
}
