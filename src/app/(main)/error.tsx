'use client'

import { useEffect } from 'react'

import { ArrowSmallRightIcon, HomeIcon, WarningSmallIcon } from '@/shared/icons'
import { ErrorScreen } from '@/widgets/ErrorScreen'

interface MainErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function MainError({ error, reset }: MainErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <ErrorScreen
      variant="inline"
      icon={<WarningSmallIcon />}
      iconTone="critical"
      code="Ошибка"
      title="Что-то пошло не так"
      description="Произошла непредвиденная ошибка. Попробуйте перезагрузить раздел."
      primaryAction={{
        label: 'Попробовать снова',
        onClick: reset,
        icon: <ArrowSmallRightIcon />,
      }}
      secondaryAction={{
        label: 'На главную',
        href: '/dashboard',
        variant: 'ghost',
        icon: <HomeIcon />,
      }}
    />
  )
}
