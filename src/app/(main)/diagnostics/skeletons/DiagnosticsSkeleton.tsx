import { Card, CardHeader } from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui/Skeleton'

import s from './DiagnosticsSkeleton.module.scss'

const COUNTERS_COUNT = 5
const LEGEND_ROWS = 4
const BOARD_COLUMNS = 5
const CARDS_PER_COLUMN = 3

export function DiagnosticsSkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <div className={s.topRow}>
        <div className={s.leftCol}>
          <FiltersSkeleton />
          <CountersSkeleton />
        </div>
        <div className={s.chartCol}>
          <ChartSkeleton />
        </div>
      </div>
      <BoardSkeleton />
    </>
  )
}

function HeaderSkeleton() {
  return (
    <header className={s.header}>
      <Skeleton className={s.headerTitle} />
      <div className={s.headerAction}>
        <Skeleton className={s.headerBtn} radius="lg" />
        <Skeleton className={s.headerBtnPrimary} radius="lg" />
      </div>
    </header>
  )
}

function FiltersSkeleton() {
  return (
    <div className={s.filters}>
      <Skeleton className={s.filterBtn} radius="lg" />
      <Skeleton className={s.filterBtn} radius="lg" />
      <Skeleton className={s.filterBtn} radius="lg" />
    </div>
  )
}

function CountersSkeleton() {
  return (
    <div className={s.counters}>
      {Array.from({ length: COUNTERS_COUNT }).map((_, i) => (
        <Card key={i} padding="md" className={s.counter}>
          <Skeleton className={s.counterDot} radius="circle" />
          <div className={s.counterText}>
            <Skeleton className={s.counterLabel} />
            <Skeleton className={s.counterValue} />
          </div>
        </Card>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <Card padding="md" className={s.chartCard}>
      <CardHeader title={<Skeleton className={s.chartTitle} />} className={s.chartHeader} />
      <div className={s.chartWrap}>
        <Skeleton className={s.donut} radius="circle" />
        <div className={s.donutHole} />
      </div>
      <div className={s.legend}>
        {Array.from({ length: LEGEND_ROWS }).map((_, i) => (
          <div key={i} className={s.legendRow}>
            <Skeleton className={s.legendDot} radius="circle" />
            <Skeleton className={s.legendName} />
            <Skeleton className={s.legendValue} />
          </div>
        ))}
      </div>
    </Card>
  )
}

function BoardSkeleton() {
  return (
    <div className={s.board}>
      {Array.from({ length: BOARD_COLUMNS }).map((_, i) => (
        <div key={i} className={s.column}>
          <div className={s.columnHeader}>
            <Skeleton className={s.columnTitle} />
            <Skeleton className={s.columnCount} radius="md" />
          </div>
          <div className={s.list}>
            {Array.from({ length: CARDS_PER_COLUMN }).map((_, j) => (
              <KanbanCardSkeleton key={j} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function KanbanCardSkeleton() {
  return (
    <div className={s.card}>
      <div className={s.cardHead}>
        <Skeleton className={s.avatar} radius="circle" />
        <div className={s.cardInfo}>
          <Skeleton className={s.cardName} />
          <Skeleton className={s.cardPosition} />
        </div>
      </div>
      <div className={s.cardBarRow}>
        <Skeleton className={s.bar} radius="pill" />
        <Skeleton className={s.score} />
      </div>
      <Skeleton className={s.reason} />
      <Skeleton className={s.cardBtn} radius="lg" />
    </div>
  )
}
