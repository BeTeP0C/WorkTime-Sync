import { Metadata } from 'next'

import { DashboardClient } from './DashboardClient'

export const metadata: Metadata = {
  title: 'Главная · WorkTime Sync',
}

export default function DashboardPage() {
  return <DashboardClient />
}
