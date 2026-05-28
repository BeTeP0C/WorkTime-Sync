import { Metadata } from 'next'

import { ArrowSmallRightIcon, HomeIcon, InterrogationIcon } from '@/shared/icons'
import { ErrorScreen } from '@/widgets/ErrorScreen'

export const metadata: Metadata = {
  title: '404 — WorkTime Sync',
}

export default function NotFound() {
  return (
    <ErrorScreen
      variant="standalone"
      icon={<InterrogationIcon />}
      iconTone="info"
      code="404"
      title="Страница не найдена"
      description="Похоже, такой страницы не существует или она была перемещена."
      primaryAction={{ label: 'На дашборд', href: '/dashboard', icon: <HomeIcon /> }}
      secondaryAction={{
        label: 'На главную',
        href: '/',
        variant: 'ghost',
        icon: <ArrowSmallRightIcon />,
      }}
    />
  )
}
