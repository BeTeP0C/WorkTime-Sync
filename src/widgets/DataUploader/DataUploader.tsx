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

const MAX_VISIBLE_ERRORS = 5
// 10 MB — больше уже не помещается в одной транзакции импорта на бэке
// без особой настройки; на UI лучше дать понятный отказ, чем повесить вкладку
// на чтении 100MB-файла или получить таймаут upload'а.
const MAX_FILE_BYTES = 10 * 1024 * 1024

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export const DataUploader = observer(function DataUploader() {
  const dashboard = useDashboardStore()
  const [activeTab, setActiveTab] = useState<Tab>('Календарь')

  const isUploading = dashboard.uploadStage.isLoading

  const handleFiles = async (files: File[]): Promise<void> => {
    const file = files[0]
    if (!file) return
    if (file.size > MAX_FILE_BYTES) {
      dashboard.reportLocalError(
        activeTab,
        file.name,
        `Файл слишком большой: ${formatBytes(file.size)}. Максимум ${formatBytes(MAX_FILE_BYTES)}.`
      )
      return
    }
    const lower = file.name.toLowerCase()
    if (lower.endsWith('.csv')) {
      await dashboard.uploadCsv(activeTab, file)
      return
    }
    if (lower.endsWith('.json')) {
      try {
        const text = await file.text()
        const parsed: unknown = JSON.parse(text)
        if (!Array.isArray(parsed)) {
          dashboard.reportLocalError(
            activeTab,
            file.name,
            'JSON-файл должен содержать массив событий на верхнем уровне'
          )
          return
        }
        await dashboard.uploadJson(activeTab, parsed, file.name)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Не удалось прочитать JSON'
        dashboard.reportLocalError(activeTab, file.name, `Невалидный JSON: ${message}`)
      }
      return
    }
    dashboard.reportLocalError(
      activeTab,
      file.name,
      'Неподдерживаемый формат. Используйте .csv или .json'
    )
  }

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { 'text/csv': ['.csv'], 'application/json': ['.json'] },
    multiple: false,
    disabled: isUploading,
    noClick: false,
    onDrop: (files) => {
      void handleFiles(files)
    },
  })

  const result = dashboard.lastImportResult
  const errorMessage = dashboard.lastImportError
  const resultTone: 'ok' | 'partial' | 'error' | null = errorMessage
    ? 'error'
    : result
      ? result.importedCount === 0
        ? 'error'
        : result.errors.length > 0
          ? 'partial'
          : 'ok'
      : null

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
            disabled={isUploading}
          >
            {t}
          </button>
        ))}
      </div>

      <div
        {...getRootProps()}
        className={cn(s.dropzone, isDragActive && s.dropzoneActive, isUploading && s.dropzoneBusy)}
      >
        <input {...getInputProps()} />
        <div className={cn(s.dropIcon, isUploading && s.dropIconBusy)}>
          <UploadSyncIcon />
        </div>
        <div className={s.dropText}>
          {isUploading ? 'Загружаем данные…' : 'Перетащите CSV или JSON файл сюда'}
        </div>
        <div className={s.dropHint}>Поддерживаются форматы .csv и .json</div>
        <div className={s.dropActions}>
          <Button
            variant="primary"
            size="sm"
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              open()
            }}
            disabled={isUploading}
          >
            Выбрать файл
          </Button>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            className={s.btnOutline}
            onClick={(e) => {
              e.stopPropagation()
              void dashboard.generateSample(activeTab)
            }}
            disabled={isUploading}
          >
            Сгенерировать тестовые данные
          </Button>
        </div>
      </div>

      {resultTone && (
        <div
          className={cn(
            s.result,
            resultTone === 'ok' && s.resultOk,
            resultTone === 'partial' && s.resultPartial,
            resultTone === 'error' && s.resultError
          )}
          role="status"
        >
          {errorMessage ? (
            <span className={s.resultText}>Ошибка: {errorMessage}</span>
          ) : result ? (
            <>
              <span className={s.resultText}>
                Загружено: {result.importedCount}. Пропущено дублей: {result.skippedDuplicateCount}.
                Ошибок: {result.errors.length}.
              </span>
              {result.errors.length > 0 && (
                <ul className={s.errorList}>
                  {result.errors.slice(0, MAX_VISIBLE_ERRORS).map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                  {result.errors.length > MAX_VISIBLE_ERRORS && (
                    <li>и ещё {result.errors.length - MAX_VISIBLE_ERRORS}…</li>
                  )}
                </ul>
              )}
            </>
          ) : null}
        </div>
      )}

      <div className={s.historyHeader}>
        <span className={s.historyTitle}>Последние загрузки</span>
      </div>
      {dashboard.importHistory.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>
            <DatabaseIcon width={20} height={20} />
          </div>
          <div className={s.emptyTitle}>Загрузок пока нет</div>
          <div className={s.emptyHint}>
            История появится после первой загрузки CSV или JSON файла.
          </div>
        </div>
      ) : (
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
      )}
    </Card>
  )
})
