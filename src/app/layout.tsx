import { Metadata } from 'next'
import { ReactNode } from 'react'

import { RootStoreProvider } from '@/app-store/context'

import './globals.scss'

export const metadata: Metadata = {
  title: 'WorkTime Sync',
  description: 'Система актуализации рабочего времени сотрудников',
}

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru">
      <body>
        <RootStoreProvider>{children}</RootStoreProvider>
      </body>
    </html>
  )
}
