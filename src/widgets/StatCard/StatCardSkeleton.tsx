import cn from 'classnames'

import { Card } from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui/Skeleton'

import s from './StatCard.module.scss'
import sk from './StatCardSkeleton.module.scss'

export function StatCardSkeleton() {
  return (
    <Card padding="lg" className={cn(s.card, sk.card)}>
      <div className={s.head}>
        <Skeleton className={sk.icon} radius="sm" />
        <Skeleton className={sk.label} radius="sm" />
      </div>
      <Skeleton className={sk.value} radius="sm" />
      <div className={s.footer}>
        <Skeleton className={sk.trend} radius="sm" />
      </div>
    </Card>
  )
}
