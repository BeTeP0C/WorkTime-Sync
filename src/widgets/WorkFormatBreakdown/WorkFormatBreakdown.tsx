'use client'

import { observer } from 'mobx-react-lite'

import { useEmployeesStore } from '@/app-store/context'
import { WORK_FORMAT_LABEL_RU, WorkFormat } from '@/entities/employee/model/types'
import { Card, CardHeader } from '@/shared/ui/Card'

import s from './WorkFormatBreakdown.module.scss'

const ORDER: WorkFormat[] = ['office', 'remote', 'hybrid']

const COLORS: Record<WorkFormat, string> = {
  office: '#3b6fe8',
  remote: '#16a34a',
  hybrid: '#a855f7',
}

export const WorkFormatBreakdown = observer(function WorkFormatBreakdown() {
  const store = useEmployeesStore()
  const distribution = store.byWorkFormat
  const total = ORDER.reduce((acc, k) => acc + (distribution[k] ?? 0), 0)

  return (
    <Card padding="md" className={s.card}>
      <CardHeader title="Форматы работы" />

      <div className={s.list}>
        {ORDER.map((format) => {
          const value = distribution[format] ?? 0
          const percent = total > 0 ? Math.round((value / total) * 100) : 0
          return (
            <div key={format} className={s.row}>
              <div className={s.head}>
                <span className={s.label}>{WORK_FORMAT_LABEL_RU[format]}</span>
                <span className={s.value}>
                  {value} чел. <span className={s.percent}>/ {percent}%</span>
                </span>
              </div>
              <div className={s.track}>
                <span
                  className={s.fill}
                  style={{ width: `${percent}%`, background: COLORS[format] }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
})
