import { BookIcon } from '@/shared/icons'
import { Card, CardHeader } from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui/Skeleton'

import s from './EmployeeMetricsTable.module.scss'
import sk from './EmployeeMetricsTableSkeleton.module.scss'

const ROW_COUNT = 6

export function EmployeeMetricsTableSkeleton() {
  return (
    <Card padding="lg" className={s.card}>
      <CardHeader title="Все показатели по сотрудникам" icon={<BookIcon width={20} height={20} />} />
      <div className={s.scroll}>
        <div className={s.table}>
          <div className={s.tableHead}>
            <div className={s.colName}>Сотрудник</div>
            <div>Ai — актуальность</div>
            <div>Ci — конфликты</div>
            <div>Li — загрузка</div>
            <div>Ri — риск</div>
            <div>Дней без обновления</div>
            <div className={s.colStatus}>Статус</div>
          </div>
          <div className={s.body}>
            {Array.from({ length: ROW_COUNT }).map((_, i) => (
              <div key={i} className={s.row}>
                <div className={s.colName}>
                  <Skeleton className={sk.avatar} radius="circle" />
                  <Skeleton className={sk.name} radius="sm" />
                </div>
                <div className={s.metricCell}>
                  <div className={s.metricCellInner}>
                    <Skeleton className={sk.metricValue} radius="sm" />
                    <Skeleton className={sk.metricBar} radius="pill" />
                  </div>
                </div>
                <div className={s.simpleCell}>
                  <Skeleton className={sk.simple} radius="sm" inline />
                </div>
                <div className={s.metricCell}>
                  <div className={s.metricCellInner}>
                    <Skeleton className={sk.metricValue} radius="sm" />
                    <Skeleton className={sk.metricBar} radius="pill" />
                  </div>
                </div>
                <div className={s.simpleCell}>
                  <Skeleton className={sk.simple} radius="sm" inline />
                </div>
                <div className={s.simpleCell}>
                  <Skeleton className={sk.days} radius="sm" inline />
                </div>
                <div className={s.colStatus}>
                  <Skeleton className={sk.badge} radius="pill" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
