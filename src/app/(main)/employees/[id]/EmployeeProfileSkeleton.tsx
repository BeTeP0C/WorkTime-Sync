import cn from 'classnames'

import { Card, CardHeader } from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui/Skeleton'
import { AppHeader } from '@/widgets/AppHeader'

import s from './EmployeeProfileClient.module.scss'
import sk from './EmployeeProfileSkeleton.module.scss'
import metricsS from '@/widgets/EmployeeMetricsCards/EmployeeMetricsCards.module.scss'

const WORK_DAYS = [0, 1, 2, 3, 4, 5, 6]
const METRIC_KEYS = [0, 1, 2]
const SCHEDULE_ROWS = [0, 1, 2, 3]
const EXCEPTION_ROWS = [0, 1, 2]
const REC_ROWS = [0, 1, 2, 3]
const CONFIRM_ROWS = [0, 1]

export function EmployeeProfileSkeleton() {
  return (
    <>
      <AppHeader
        breadcrumb={<Skeleton className={sk.crumb} radius="sm" />}
        title={<Skeleton className={sk.title} radius="sm" />}
        action={
          <>
            <Skeleton className={sk.actionBtn} radius="md" />
            <Skeleton className={sk.actionBtnWide} radius="md" />
          </>
        }
      />

      <Card padding="lg" className={s.hero}>
        <Skeleton className={sk.avatar} radius="circle" />
        <div className={s.heroInfo}>
          <Skeleton className={sk.heroName} radius="sm" />
          <div className={s.heroPosition}>
            <Skeleton className={sk.heroPosA} radius="sm" />
            <Skeleton className={sk.heroPosB} radius="sm" />
          </div>
          <div className={s.heroTags}>
            <Skeleton className={sk.tag1} radius="sm" />
            <Skeleton className={sk.tag2} radius="sm" />
            <Skeleton className={sk.tag3} radius="sm" />
          </div>
        </div>
        <Skeleton className={cn(s.heroRiskBadge, sk.riskBadge)} radius="sm" />
      </Card>

      <div className={metricsS.grid}>
        {METRIC_KEYS.map((i) => (
          <Card key={i} padding="lg" className={metricsS.card}>
            <Skeleton className={sk.metricLabel} radius="sm" />
            <Skeleton className={sk.metricValue} radius="sm" />
            <div className={metricsS.barRow}>
              <Skeleton className={sk.metricBar} radius="pill" />
              <Skeleton className={sk.metricPercent} radius="sm" />
            </div>
            <Skeleton className={sk.metricHint} radius="sm" />
          </Card>
        ))}
      </div>

      <div className={s.grid}>
        <div className={s.gridCol}>
          <Card padding="lg" className={s.scheduleCard}>
            <CardHeader title={<Skeleton className={sk.cardTitle} radius="sm" />} />
            <div className={s.schedule}>
              <div className={s.workdays}>
                {WORK_DAYS.map((d) => (
                  <Skeleton key={d} className={sk.workDay} radius="circle" />
                ))}
              </div>
              {SCHEDULE_ROWS.map((i) => (
                <div key={i} className={s.scheduleRow}>
                  <Skeleton className={sk.rowLabel} radius="sm" />
                  <Skeleton className={sk.rowValue} radius="sm" />
                </div>
              ))}
            </div>
          </Card>

          <Card padding="lg" className={s.exceptionsCard}>
            <CardHeader title={<Skeleton className={sk.cardTitle} radius="sm" />} />
            <div className={s.exceptions}>
              {EXCEPTION_ROWS.map((i) => (
                <div key={i} className={s.exceptionRow}>
                  <Skeleton className={sk.exceptionIcon} radius={10} />
                  <div className={s.exceptionInfo}>
                    <Skeleton className={sk.exceptionTitle} radius="sm" />
                    <Skeleton className={sk.exceptionDates} radius="sm" />
                  </div>
                  <Skeleton className={sk.exceptionBadge} radius="pill" />
                </div>
              ))}
            </div>
            <Skeleton className={sk.addBtn} radius="pill" />
          </Card>
        </div>

        <div className={s.gridCol}>
          <Card padding="lg" className={s.recsCard}>
            <CardHeader title={<Skeleton className={sk.cardTitle} radius="sm" />} />
            <ul className={s.recs}>
              {REC_ROWS.map((i) => (
                <li key={i} className={s.recItem}>
                  <Skeleton className={sk.recDot} radius="circle" />
                  <div className={s.recBody}>
                    <Skeleton className={sk.recTitle} radius="sm" />
                    <Skeleton className={sk.recReason} radius="sm" />
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card padding="lg" className={s.confirmCard}>
            <CardHeader title={<Skeleton className={sk.cardTitleWide} radius="sm" />} />
            <div className={sk.confirmText}>
              <Skeleton className={sk.confirmLine} radius="sm" />
              <Skeleton className={sk.confirmLine} radius="sm" />
              <Skeleton className={sk.confirmLineShort} radius="sm" />
            </div>
            <div className={s.confirmRows}>
              {CONFIRM_ROWS.map((i) => (
                <div key={i} className={s.scheduleRow}>
                  <Skeleton className={sk.rowLabel} radius="sm" />
                  <Skeleton className={sk.rowValue} radius="sm" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
