'use client'

import Link from 'next/link'
import { observer } from 'mobx-react-lite'

import { useEmployeesStore } from '@/app-store/context'
import { RISK_SHORT_LABEL_RU } from '@/entities/employee/model/types'
import { Avatar } from '@/shared/ui/Avatar'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card, CardHeader } from '@/shared/ui/Card'
import { ProgressBar } from '@/shared/ui/ProgressBar'

import s from './AttentionList.module.scss'

export const AttentionList = observer(function AttentionList() {
  const store = useEmployeesStore()
  const items = store.attentionEmployees

  return (
    <Card padding="md" className={s.card}>
      <CardHeader
        title="Требуют внимания"
        action={
          <Link href="/diagnostics" className={s.link}>
            Диагностика →
          </Link>
        }
      />

      <div className={s.list}>
        {items.length === 0 && <div className={s.empty}>Все сотрудники в норме</div>}
        {items.map((emp) => {
          const m = emp.metric
          if (!m) return null
          return (
            <Link key={emp.id} href={`/employees/${emp.id}`} className={s.row}>
              <Avatar
                initials={emp.initials}
                fullName={emp.fullName}
                colorSeed={emp.id}
                size="sm"
              />
              <div className={s.info}>
                <div className={s.name}>{emp.fullName}</div>
                <div className={s.reason}>{store.attentionReason(emp)}</div>
              </div>
              <div className={s.metric}>
                <ProgressBar
                  value={m.actualityScore}
                  tone={m.riskLevel === 'critical' ? 'critical' : 'high'}
                  size="sm"
                  className={s.bar}
                />
                <span className={s.score}>{m.actualityScore.toFixed(2)}</span>
              </div>
              <Badge tone={m.riskLevel} size="sm">
                {RISK_SHORT_LABEL_RU[m.riskLevel]}
              </Badge>
            </Link>
          )
        })}
      </div>

      <Button variant="primary" size="md" fullWidth className={s.bulk}>
        Отправить запросы всем
      </Button>
    </Card>
  )
})
