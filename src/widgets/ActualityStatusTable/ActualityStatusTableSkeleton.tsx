import { Card, CardHeader } from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui/Skeleton'

import s from './ActualityStatusTableSkeleton.module.scss'

const ROWS = 5

export function ActualityStatusTableSkeleton() {
  return (
    <Card padding="md" className={s.card}>
      <CardHeader title="Статус актуальности данных" />
      <div className={s.list}>
        {Array.from({ length: ROWS }).map((_, i) => (
          <div key={i} className={s.row}>
            <Skeleton className={s.avatar} radius="pill" />
            <div className={s.info}>
              <Skeleton className={s.line} radius="sm" />
              <Skeleton className={s.lineShort} radius="sm" />
            </div>
            <Skeleton className={s.format} radius="md" />
            <Skeleton className={s.bar} radius="sm" />
            <Skeleton className={s.badge} radius="md" />
          </div>
        ))}
      </div>
    </Card>
  )
}
