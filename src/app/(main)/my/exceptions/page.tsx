import { Metadata } from 'next'

import { ExceptionsClient } from './ExceptionsClient'

export const metadata: Metadata = {
  title: 'Мои исключения · WorkTime Sync',
}

export default function MyExceptionsPage() {
  return <ExceptionsClient />
}
