import { DatabaseIcon } from '@/shared/icons'
import { Card, CardHeader } from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui/Skeleton'

import s from './DataUploaderSkeleton.module.scss'

const TAB_COUNT = 4
const HISTORY_ROW_COUNT = 4

export function DataUploaderSkeleton() {
  return (
    <Card padding="md" className={s.card}>
      <CardHeader title="Загрузка данных" icon={<DatabaseIcon width={16} height={16} />} />

      <div className={s.tabs}>
        {Array.from({ length: TAB_COUNT }).map((_, i) => (
          <Skeleton key={i} className={s.tab} radius="md" />
        ))}
      </div>

      <div className={s.dropzone}>
        <Skeleton className={s.dropIcon} radius="md" />
        <Skeleton className={s.dropText} radius="sm" />
        <Skeleton className={s.dropHint} radius="sm" />
        <div className={s.dropActions}>
          <Skeleton className={s.dropBtn} radius="md" />
          <Skeleton className={s.dropBtnOutline} radius="md" />
        </div>
      </div>

      <div className={s.historyHeader}>
        <Skeleton className={s.historyTitle} radius="sm" />
      </div>

      <div className={s.history}>
        {Array.from({ length: HISTORY_ROW_COUNT }).map((_, i) => (
          <div key={i} className={s.historyRow}>
            <Skeleton className={s.cellSource} radius="sm" />
            <Skeleton className={s.cellFile} radius="sm" />
            <Skeleton className={s.cellDate} radius="sm" />
            <Skeleton className={s.cellStatus} radius="pill" />
          </div>
        ))}
      </div>
    </Card>
  )
}
