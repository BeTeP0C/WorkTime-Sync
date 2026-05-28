import { Card } from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui/Skeleton'

import s from './RoadmapSkeleton.module.scss'

const CARD_COUNT = 4

export function RoadmapSkeleton() {
  return (
    <>
      <header className={s.header}>
        <Skeleton className={s.title} />
        <Skeleton className={s.button} radius="lg" />
      </header>

      <div className={s.stats}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} padding="lg" className={s.stat}>
            <Skeleton className={s.statLabel} />
            <Skeleton className={s.statValue} />
          </Card>
        ))}
      </div>

      <div className={s.list}>
        {Array.from({ length: CARD_COUNT }).map((_, i) => (
          <Card key={i} padding="lg" className={s.card}>
            <Skeleton className={s.cardTitle} />
            <Skeleton className={s.cardText} />
            <Skeleton className={s.cardText} />
          </Card>
        ))}
      </div>
    </>
  )
}
