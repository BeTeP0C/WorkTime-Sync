'use client'

import { useEffect } from 'react'

import { ArrowSmallRightIcon, HomeIcon, ShieldExclamationIcon } from '@/shared/icons'
import { ErrorScreen } from '@/widgets/ErrorScreen'

import './globals.scss'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="ru">
      <body>
        <ErrorScreen
          variant="standalone"
          icon={<ShieldExclamationIcon />}
          iconTone="critical"
          code="Критическая ошибка"
          title="Приложение остановлено"
          description="Произошёл сбой на уровне приложения. Перезагрузите страницу или вернитесь позже."
          primaryAction={{
            label: 'Перезагрузить',
            onClick: reset,
            icon: <ArrowSmallRightIcon />,
          }}
          secondaryAction={{
            label: 'На дашборд',
            href: '/dashboard',
            variant: 'ghost',
            icon: <HomeIcon />,
          }}
        />
      </body>
    </html>
  )
}
