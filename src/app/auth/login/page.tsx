import { Metadata } from 'next'

import { LoginClient } from './LoginClient'

export const metadata: Metadata = {
  title: 'Вход · WorkTime Sync',
}

export default function LoginPage() {
  return <LoginClient />
}
