import { Metadata } from 'next'

import { MyScheduleClient } from './MyScheduleClient'

export const metadata: Metadata = {
  title: 'Рабочий график · WorkTime Sync',
}

export const dynamic = 'force-static'

export default function MySchedulePage() {
  return <MyScheduleClient />
}
