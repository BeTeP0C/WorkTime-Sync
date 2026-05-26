import { Metadata } from 'next'

import { MetricsClient } from './MetricsClient'

export const metadata: Metadata = {
  title: 'Расчёт показателей · WorkTime Sync',
}

export default function MetricsPage() {
  return <MetricsClient />
}
