'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import cn from 'classnames'
import { observer } from 'mobx-react-lite'

import { useDashboardStore } from '@/app-store/context'
import {
  CheckSmallIcon,
  DatabaseIcon,
  UploadSyncIcon,
  WarningSmallIcon,
  XSmallIcon,
} from '@/shared/icons'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card, CardHeader } from '@/shared/ui/Card'

import s from './DataUploader.module.scss'

const TABS = ['Календарь', 'HR-система', 'Таск-трекер', 'Табель'] as const
type Tab = (typeof TABS)[number]

const STATUS_TONE = {
  ok: 'success' as const,
  partial: 'warning' as const,
  error: 'critical' as const,
}

const STATUS_LABEL = {
  ok: 'Готово',
  partial: 'Частично',
  error: 'Ошибка',
}

const STATUS_ICON = {
  ok: CheckSmallIcon,
  partial: WarningSmallIcon,
  error: XSmallIcon,
}

export const DataUploader = observer(function DataUploader() {
  const dashboard = useDashboardStore()
  const [activeTab, setActiveTab] = useState<Tab>('Календарь')
  const [acceptedName, setAcceptedName] = useState<string | null>(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'text/csv': ['.csv'], 'application/json': ['.json'] },
    multiple: false,
    onDrop: (files) => {
      const file = files[0]
      if (file) setAcceptedName(file.name)
    },
  })

  return (
    <Card padding="md" className={s.card}>
      <CardHeader title="Загрузка данных" icon={<DatabaseIcon width={16} height={16} />} />

      <div className={s.tabs}>
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={cn(s.tab, activeTab === t && s.tabActive)}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div {...getRootProps()} className={cn(s.dropzone, isDragActive && s.dropzoneActive)}>
        <input {...getInputProps()} />
        <div className={s.dropIcon}>
          <UploadSyncIcon />
        </div>
        <div className={s.dropText}>
          {acceptedName ? `Файл выбран: ${acceptedName}` : 'Перетащите CSV или JSON файл сюда'}
        </div>
        <div className={s.dropHint}>Поддерживаются форматы .csv и .json</div>
        <div className={s.dropActions}>
          <Button variant="primary" size="sm" type="button">
            Выбрать файл
          </Button>
          <Button variant="secondary" size="sm" type="button" className={s.btnOutline}>
            Сгенерировать тестовые данные
          </Button>
        </div>
      </div>

      <div className={s.historyHeader}>
        <span className={s.historyTitle}>Последние загрузки</span>
      </div>
      <div className={s.history}>
        <div className={cn(s.historyRow, s.historyHead)}>
          <span>Источник</span>
          <span>Файл</span>
          <span>Дата</span>
          <span>Статус</span>
        </div>
        {dashboard.importHistory.map((row) => {
          const StatusIcon = STATUS_ICON[row.status]
          return (
            <div key={row.id} className={s.historyRow}>
              <span className={s.cellSource}>{row.source}</span>
              <span className={s.cellFile}>{row.file}</span>
              <span className={s.cellMuted}>{row.date}</span>
              <Badge tone={STATUS_TONE[row.status]} size="sm" pill className={s.cellStatus}>
                <StatusIcon className={s.statusIcon} />
                {STATUS_LABEL[row.status]}
              </Badge>
            </div>
          )
        })}
      </div>
    </Card>
  )
})
