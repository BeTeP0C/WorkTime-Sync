import { Card, CardHeader } from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui/Skeleton'

import s from './WorkFormatBreakdownSkeleton.module.scss'

const ROWS = 3

export function WorkFormatBreakdownSkeleton() {
  return (
    <Card padding="md" className={s.card}>
      <CardHeader title="Форматы работы" />
      <div className={s.list}>
        {Array.from({ length: ROWS }).map((_, i) => (
          <div key={i} className={s.row}>
            <div className={s.head}>
              <Skeleton className={s.label} radius="sm" />
              <Skeleton className={s.value} radius="sm" />
            </div>
            <Skeleton className={s.bar} radius="pill" />
          </div>
        ))}
      </div>
    </Card>
  )
}
