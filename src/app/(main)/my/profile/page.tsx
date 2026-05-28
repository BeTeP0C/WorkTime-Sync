import { Metadata } from 'next'

import { MyProfileClient } from './MyProfileClient'

export const metadata: Metadata = {
  title: 'Мой профиль · WorkTime Sync',
}

export const dynamic = 'force-static'

export default function MyProfilePage() {
  return <MyProfileClient />
}
