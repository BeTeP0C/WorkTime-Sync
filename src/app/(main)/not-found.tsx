import { Metadata } from 'next'

import { ArrowSmallRightIcon, InterrogationIcon } from '@/shared/icons'
import { ErrorScreen } from '@/widgets/ErrorScreen'

export const metadata: Metadata = {
  title: 'Не найдено — WorkTime Sync',
}

export default function MainNotFound() {
  return (
    <ErrorScreen
      variant="inline"
      icon={<InterrogationIcon />}
      iconTone="info"
      code="404"
      title="Ничего не найдено"
      description="Раздел не существует или у вас нет к нему доступа."
      primaryAction={{ label: 'К дашборду', href: '/dashboard', icon: <ArrowSmallRightIcon /> }}
      secondaryAction={{ label: 'Назад', href: '/dashboard', variant: 'ghost' }}
    />
  )
}
