'use client'

import { useMemo } from 'react'

import { ROADMAP_STATUS_LABEL_RU, RoadmapItem, RoadmapStatus } from '@/entities/roadmap/model/types'

import { RoadmapKanbanCard } from './RoadmapKanbanCard'

import s from './RoadmapKanban.module.scss'

const COLUMN_ORDER: RoadmapStatus[] = [
  'pending',
  'requested',
  'acknowledged',
  'updated',
  'completed',
]

const COLUMN_ACCENT: Record<RoadmapStatus, string> = {
  pending: '#d97706',
  requested: '#f59e0b',
  acknowledged: '#ea580c',
  updated: '#16a34a',
  completed: '#16a34a',
  deferred: '#94a3b8',
  ignored: '#94a3b8',
  dismissed: '#94a3b8',
}

interface RoadmapKanbanProps {
  items: RoadmapItem[]
  onOpen: (item: RoadmapItem) => void
}

export function RoadmapKanban({ items, onOpen }: RoadmapKanbanProps) {
  const byStatus = useMemo<Record<RoadmapStatus, RoadmapItem[]>>(() => {
    const map: Record<RoadmapStatus, RoadmapItem[]> = {
      pending: [],
      requested: [],
      acknowledged: [],
      updated: [],
      completed: [],
      deferred: [],
      ignored: [],
      dismissed: [],
    }
    for (const item of items) {
      const list = map[item.status]
      if (list) list.push(item)
    }
    for (const key of Object.keys(map) as RoadmapStatus[]) {
      map[key].sort((a, b) => b.priorityScore - a.priorityScore)
    }
    return map
  }, [items])

  return (
    <div className={s.board}>
      {COLUMN_ORDER.map((status) => {
        const list = byStatus[status]
        return (
          <section key={status} className={s.column}>
            <header className={s.columnHead}>
              <span className={s.accent} style={{ background: COLUMN_ACCENT[status] }} />
              <span className={s.columnTitle}>{ROADMAP_STATUS_LABEL_RU[status]}</span>
              <span className={s.columnCount}>{list.length}</span>
            </header>
            <div className={s.columnBody}>
              {list.length === 0 ? (
                <div className={s.empty}>Нет задач</div>
              ) : (
                list.map((item) => <RoadmapKanbanCard key={item.id} item={item} onOpen={onOpen} />)
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
