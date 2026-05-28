'use client'

import Link from 'next/link'
import { observer } from 'mobx-react-lite'

import { useEmployeesStore } from '@/app-store/context'
import { RISK_LABEL_RU, RiskLevel, WORK_FORMAT_LABEL_RU } from '@/entities/employee/model/types'
import { ListCheckIcon, ShieldCheckIcon } from '@/shared/icons'
import { Avatar } from '@/shared/ui/Avatar'
import { Badge, BadgeTone } from '@/shared/ui/Badge'
import { Card, CardHeader } from '@/shared/ui/Card'
import type { ProgressTone } from '@/shared/ui/ProgressBar'
import { ProgressBar } from '@/shared/ui/ProgressBar'

import s from './ActualityStatusTable.module.scss'

const RISK_AVATAR_BG: Record<RiskLevel, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#d97706',
  low: '#16a34a',
}

const STATUS_TONE: Record<RiskLevel, BadgeTone> = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'success',
}

const STATUS_LABEL: Record<RiskLevel, string> = {
  critical: 'Критический',
  high: 'Высокий',
  medium: 'Средний',
  low: 'Актуален',
}

export const ActualityStatusTable = observer(function ActualityStatusTable() {
  const store = useEmployeesStore()
  const items = store.lowestActualityEmployees

  return (
    <Card padding="md" className={s.card}>
      <CardHeader
        title="Статус актуальности данных"
        icon={<ListCheckIcon width={16} height={16} />}
        action={
          <Link href="/employees" className={s.link}>
            Все сотрудники →
          </Link>
        }
      />

      {items.length === 0 ? (
        <div className={s.empty}>
          <div className={s.emptyIcon}>
            <ShieldCheckIcon width={28} height={28} />
          </div>
          <div className={s.emptyTitle}>Нет данных о сотрудниках</div>
          <div className={s.emptyHint}>Загрузите данные, чтобы увидеть статус актуальности</div>
        </div>
      ) : (
        <div className={s.list}>
          {items.map((emp) => {
            const m = emp.metric
            if (!m) return null
            const riskLevel = m.riskLevel
            return (
              <Link key={emp.id} href={`/employees/${emp.id}`} className={s.row}>
                <Avatar
                  initials={emp.initials}
                  fullName={emp.fullName}
                  bg={RISK_AVATAR_BG[riskLevel]}
                  size="sm"
                />
                <div className={s.info}>
                  <div className={s.name}>{emp.fullName}</div>
                  <div className={s.position}>{emp.position || RISK_LABEL_RU[riskLevel]}</div>
                </div>
                <Badge tone="neutral" size="sm" pill className={s.format}>
                  {WORK_FORMAT_LABEL_RU[emp.workFormat]}
                </Badge>
                <div className={s.metric}>
                  <ProgressBar
                    value={m.actualityScore}
                    tone={riskLevel as ProgressTone}
                    size="sm"
                    className={s.bar}
                  />
                  <span className={s.score}>{m.actualityScore.toFixed(2)}</span>
                </div>
                <Badge tone={STATUS_TONE[riskLevel]} size="sm" pill>
                  {STATUS_LABEL[riskLevel]}
                </Badge>
              </Link>
            )
          })}
        </div>
      )}
    </Card>
  )
})
