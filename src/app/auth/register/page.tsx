import { Metadata } from 'next'

import { RegisterClient } from './RegisterClient'

export const metadata: Metadata = {
  title: 'Регистрация · WorkTime Sync',
}

export const dynamic = 'force-static'

export default function RegisterPage() {
  return <RegisterClient />
}
