import { Card, CardHeader } from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui/Skeleton'

import s from './RecommendationsSkeleton.module.scss'

const STAT_COUNT = 4
const CHIP_COUNT = 5
const CARD_COUNT = 4

export function RecommendationsSkeleton() {
  return (
    <>
      <header className={s.header}>
        <Skeleton className={s.headerTitle} />
        <div className={s.headerAction}>
          <Skeleton className={s.headerBtn} radius="lg" />
          <Skeleton className={s.headerBtnPrimary} radius="lg" />
        </div>
      </header>

      <div className={s.stats}>
        {Array.from({ length: STAT_COUNT }).map((_, i) => (
          <Card key={i} padding="lg" className={s.stat}>
            <div className={s.statHead}>
              <Skeleton className={s.statIcon} radius="circle" />
              <Skeleton className={s.statLabel} />
            </div>
            <Skeleton className={s.statValue} />
          </Card>
        ))}
      </div>

      <div className={s.chips}>
        {Array.from({ length: CHIP_COUNT }).map((_, i) => (
          <Skeleton key={i} className={s.chip} radius="lg" />
        ))}
      </div>

      <div className={s.content}>
        <div className={s.list}>
          {Array.from({ length: CARD_COUNT }).map((_, i) => (
            <RecommendationCardSkeleton key={i} />
          ))}
        </div>
        <aside className={s.sidebar}>
          <Card padding="md" className={s.sideCard}>
            <CardHeader title={<Skeleton className={s.sideTitle} />} />
            <div className={s.breakdown}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={s.breakdownRow}>
                  <Skeleton className={s.breakdownDot} radius="circle" />
                  <Skeleton className={s.breakdownLabel} />
                  <Skeleton className={s.breakdownValue} />
                </div>
              ))}
            </div>
          </Card>
          <Card padding="md" className={s.sideCard}>
            <CardHeader title={<Skeleton className={s.sideTitle} />} />
            <div className={s.chart}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className={s.bar} radius="md" />
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </>
  )
}

function RecommendationCardSkeleton() {
  return (
    <Card padding="lg" className={s.recCard}>
      <div className={s.recHead}>
        <Skeleton className={s.recTitle} />
        <Skeleton className={s.recBadge} radius="pill" />
      </div>
      <div className={s.recSubject}>
        <Skeleton className={s.recAvatar} radius="circle" />
        <Skeleton className={s.recSubjectText} />
      </div>
      <Skeleton className={s.recReason} />
      <Skeleton className={s.recReasonShort} />
      <div className={s.recActions}>
        <Skeleton className={s.recAction} radius="lg" />
        <Skeleton className={s.recActionGhost} radius="lg" />
        <Skeleton className={s.recActionGhost} radius="lg" />
      </div>
    </Card>
  )
}
