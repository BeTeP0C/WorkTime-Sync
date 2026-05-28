'use client'

import Link from 'next/link'
import { observer } from 'mobx-react-lite'

import { useEmployeesStore } from '@/app-store/context'
import { RISK_SHORT_LABEL_RU } from '@/entities/employee/model/types'
import { AlertIcon, MailIcon, ShieldCheckIcon } from '@/shared/icons'
import { Avatar } from '@/shared/ui/Avatar'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card, CardHeader } from '@/shared/ui/Card'
import type { ProgressTone } from '@/shared/ui/ProgressBar'
import { ProgressBar } from '@/shared/ui/ProgressBar'

import s from './AttentionList.module.scss'

const RISK_AVATAR_BG: Record<string, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#d97706',
  low: '#16a34a',
}

export const AttentionList = observer(function AttentionList() {
  const store = useEmployeesStore()
  const items = store.attentionEmployees

  return (
    <Card padding="md" className={s.card}>
      <CardHeader
        title="Требуют внимания"
        icon={<AlertIcon width={16} height={16} />}
        action={
          <Link href="/diagnostics" className={s.link}>
            Диагностика →
          </Link>
        }
      />

      <div className={s.list}>
        {items.length === 0 && (
          <div className={s.empty}>
            <div className={s.emptyIcon}>
              <ShieldCheckIcon width={28} height={28} />
            </div>
            <div className={s.emptyTitle}>Все сотрудники в норме</div>
            <div className={s.emptyHint}>
              Нет сотрудников с критическим или высоким уровнем риска
            </div>
          </div>
        )}
        {items.map((emp) => {
          const m = emp.metric
          if (!m) return null
          return (
            <Link key={emp.id} href={`/employees/${emp.id}`} className={s.row}>
              <Avatar
                initials={emp.initials}
                fullName={emp.fullName}
                bg={RISK_AVATAR_BG[m.riskLevel]}
                size="sm"
              />
              <div className={s.info}>
                <div className={s.name}>{emp.fullName}</div>
                <div className={s.reason}>{store.attentionReason(emp)}</div>
              </div>
              <div className={s.metric}>
                <ProgressBar
                  value={m.actualityScore}
                  tone={m.riskLevel as ProgressTone}
                  size="sm"
                  className={s.bar}
                />
                <span className={s.score}>{m.actualityScore.toFixed(2)}</span>
              </div>
              <Badge tone={m.riskLevel} size="sm" pill>
                {RISK_SHORT_LABEL_RU[m.riskLevel]}
              </Badge>
            </Link>
          )
        })}
      </div>

      <div className={s.bulkWrap}>
        <Button variant="primary" size="md" leftIcon={<MailIcon />} className={s.bulk}>
          Отправить запросы всем
        </Button>
      </div>
    </Card>
  )
})
