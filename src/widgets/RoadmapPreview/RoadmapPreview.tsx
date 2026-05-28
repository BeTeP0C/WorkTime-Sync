'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { getEmployeeRoadmap, getTeamRoadmap } from '@/entities/roadmap/api'
import {
  ROADMAP_SEVERITY_LABEL_RU,
  ROADMAP_SEVERITY_ORDER,
  ROADMAP_SEVERITY_TONE,
  RoadmapItem,
  RoadmapListResponse,
  RoadmapSeverity,
} from '@/entities/roadmap/model/types'
import { AngleRightIcon, ListCheckIcon, PlusIcon } from '@/shared/icons'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card, CardHeader } from '@/shared/ui/Card'

import s from './RoadmapPreview.module.scss'

interface RoadmapPreviewProps {
  scope: { kind: 'team'; teamId: string } | { kind: 'employee'; employeeId: string }
  /** Сколько верхних задач показывать. */
  limit?: number
  /** Если задан — рендерится кнопка «Сгенерировать» для этого скоупа. */
  onGenerate?: () => Promise<void> | void
  isGenerating?: boolean
}

function formatDue(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
}

export function RoadmapPreview({
  scope,
  limit = 3,
  onGenerate,
  isGenerating,
}: RoadmapPreviewProps) {
  const [data, setData] = useState<RoadmapListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let alive = true
    setLoading(true)
    const load =
      scope.kind === 'team'
        ? getTeamRoadmap(scope.teamId, { limit, includeClosed: false })
        : getEmployeeRoadmap(scope.employeeId, { limit, includeClosed: false })
    load
      .then((res) => {
        if (alive) {
          setData(res)
          setLoading(false)
        }
      })
      .catch(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope.kind, 'teamId' in scope ? scope.teamId : scope.employeeId, limit, reloadKey])

  const handleGenerate = async () => {
    if (!onGenerate) return
    await onGenerate()
    setReloadKey((k) => k + 1)
  }

  const items: RoadmapItem[] = data?.items.slice(0, limit) ?? []
  const counts = data?.countsBySeverity

  const fullListHref =
    scope.kind === 'team'
      ? `/roadmap?teamId=${scope.teamId}`
      : `/roadmap?employeeId=${scope.employeeId}`

  return (
    <Card padding="md">
      <CardHeader
        title="Дорожная карта"
        icon={<ListCheckIcon width={16} height={16} />}
        action={
          onGenerate && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<PlusIcon />}
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? 'Генерация…' : 'Сгенерировать'}
            </Button>
          )
        }
      />

      {counts && (
        <div className={s.counters}>
          {ROADMAP_SEVERITY_ORDER.map((sev) => {
            const value = counts[sev as RoadmapSeverity] ?? 0
            if (value === 0) return null
            return (
              <Badge key={sev} tone={ROADMAP_SEVERITY_TONE[sev]} size="sm" pill>
                {ROADMAP_SEVERITY_LABEL_RU[sev]}: {value}
              </Badge>
            )
          })}
        </div>
      )}

      {loading ? (
        <div className={s.placeholder}>Загрузка…</div>
      ) : items.length === 0 ? (
        <div className={s.placeholder}>
          Нет открытых задач актуализации.
          {onGenerate && ' Можно сгенерировать пункты по текущим метрикам.'}
        </div>
      ) : (
        <ul className={s.list}>
          {items.map((item) => {
            const due = formatDue(item.dueAt)
            return (
              <li key={item.id} className={s.row}>
                <Badge tone={ROADMAP_SEVERITY_TONE[item.severity]} size="sm" pill>
                  {ROADMAP_SEVERITY_LABEL_RU[item.severity]}
                </Badge>
                <div className={s.rowText}>
                  <span className={s.rowTitle}>{item.title}</span>
                  <span className={s.rowReason}>{item.reason}</span>
                </div>
                {due && <span className={s.rowDue}>до {due}</span>}
              </li>
            )
          })}
        </ul>
      )}

      <Link href={fullListHref} className={s.openAll}>
        <span>Открыть все задачи</span>
        <AngleRightIcon width={12} height={12} />
      </Link>
    </Card>
  )
}
