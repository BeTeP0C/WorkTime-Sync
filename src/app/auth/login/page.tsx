import { Metadata } from 'next'

import { LoginClient } from './LoginClient'

export const metadata: Metadata = {
  title: 'Вход · WorkTime Sync',
}

export const dynamic = 'force-static'

export default function LoginPage() {
  return <LoginClient />
}
