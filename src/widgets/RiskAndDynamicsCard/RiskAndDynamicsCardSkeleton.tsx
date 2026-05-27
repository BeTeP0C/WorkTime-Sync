import { ChartHistogramIcon, ChartPieIcon } from '@/shared/icons'
import { Card } from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui/Skeleton'

import s from './RiskAndDynamicsCard.module.scss'
import sk from './RiskAndDynamicsCardSkeleton.module.scss'

const LEGEND_COUNT = 4

export function RiskAndDynamicsCardSkeleton() {
  return (
    <Card padding="lg" className={s.card}>
      <section className={s.section}>
        <header className={s.sectionHeader}>
          <ChartPieIcon width={20} height={20} />
          <span>Риск неактуальности</span>
        </header>
        <div className={s.donutRow}>
          <div className={s.donutWrap}>
            <Skeleton className={sk.donut} radius="circle" />
          </div>
          <ul className={s.legend}>
            {Array.from({ length: LEGEND_COUNT }).map((_, i) => (
              <li key={i} className={s.legendItem}>
                <Skeleton className={sk.legendDot} radius="circle" />
                <Skeleton className={sk.legendLabel} radius="sm" />
                <Skeleton className={sk.legendValue} radius="sm" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={s.section}>
        <header className={s.sectionHeader}>
          <ChartHistogramIcon width={20} height={20} />
          <span>Динамика среднего Ai</span>
        </header>
        <div className={s.lineWrap}>
          <Skeleton className={sk.line} radius="md" />
        </div>
      </section>
    </Card>
  )
}
