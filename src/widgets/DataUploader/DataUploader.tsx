'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import cn from 'classnames'
import { observer } from 'mobx-react-lite'

import { useDashboardStore } from '@/app-store/context'
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
  ok: '✓ Готово',
  partial: '⚠ Частично',
  error: '✕ Ошибка',
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
      <CardHeader title="Загрузка данных" />

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
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"
              stroke="#2563eb"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className={s.dropText}>
          {acceptedName ? `Файл выбран: ${acceptedName}` : 'Перетащите CSV или JSON файл сюда'}
        </div>
        <div className={s.dropHint}>Поддерживаются форматы .csv и .json</div>
        <div className={s.dropActions}>
          <Button variant="primary" size="sm" type="button">
            Выбрать файл
          </Button>
          <Button variant="secondary" size="sm" type="button">
            Сгенерировать тестовые данные
          </Button>
        </div>
      </div>

      <div className={s.historyTitle}>Последние загрузки</div>
      <div className={s.history}>
        <div className={cn(s.historyRow, s.historyHead)}>
          <span>Источник</span>
          <span>Файл</span>
          <span>Дата</span>
          <span>Статус</span>
        </div>
        {dashboard.importHistory.map((row) => (
          <div key={row.id} className={s.historyRow}>
            <span className={s.cellMuted}>{row.source}</span>
            <span className={s.cellFile}>{row.file}</span>
            <span className={s.cellMuted}>{row.date}</span>
            <Badge tone={STATUS_TONE[row.status]} size="sm">
              {STATUS_LABEL[row.status]}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  )
})
