import { AlertIcon } from '@/shared/icons'
import { Card, CardHeader } from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui/Skeleton'

import s from './AttentionListSkeleton.module.scss'

const ROW_COUNT = 5

export function AttentionListSkeleton() {
  return (
    <Card padding="md" className={s.card}>
      <CardHeader
        title="Требуют внимания"
        icon={<AlertIcon width={16} height={16} />}
        action={<Skeleton className={s.link} radius="sm" />}
      />

      <div className={s.list}>
        {Array.from({ length: ROW_COUNT }).map((_, i) => (
          <div key={i} className={s.row}>
            <Skeleton className={s.avatar} radius="circle" />
            <div className={s.info}>
              <Skeleton className={s.name} radius="sm" />
              <Skeleton className={s.reason} radius="sm" />
            </div>
            <div className={s.metric}>
              <Skeleton className={s.bar} radius="pill" />
              <Skeleton className={s.score} radius="sm" />
            </div>
            <Skeleton className={s.badge} radius="pill" />
          </div>
        ))}
      </div>

      <div className={s.bulkWrap}>
        <Skeleton className={s.bulk} radius="md" />
      </div>
    </Card>
  )
}
