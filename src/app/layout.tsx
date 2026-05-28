import { Metadata, Viewport } from 'next'
import { ReactNode } from 'react'
import { Toaster } from 'sonner'

import { RootStoreProvider } from '@/app-store/context'
import { OfflineOverlay } from '@/widgets/OfflineStub'

import './globals.scss'

export const metadata: Metadata = {
  title: 'WorkTime Sync',
  description: 'Система актуализации рабочего времени сотрудников',
}

// Без явного viewport мобильные браузеры рендерят страницу в desktop-режиме
// шириной ~980px, поэтому ни одно media query <768 не сработает.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru">
      <body>
        <RootStoreProvider>
          {children}
          <OfflineOverlay />
          <Toaster richColors position="top-right" closeButton toastOptions={{ duration: 4000 }} />
        </RootStoreProvider>
      </body>
    </html>
  )
}
