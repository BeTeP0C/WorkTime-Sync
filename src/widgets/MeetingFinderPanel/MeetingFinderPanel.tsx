import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

import { Employee } from '@/entities/employee/model/types'
import { MeetingRecommendation } from '@/entities/team/model/types'
import { pluralizeRu } from '@/shared/lib/format'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'

import s from './MeetingFinderPanel.module.scss'

interface MeetingFinderPanelProps {
  recommendations: MeetingRecommendation[]
  members: Employee[]
}

export function MeetingFinderPanel({ recommendations, members }: MeetingFinderPanelProps) {
  if (recommendations.length === 0) {
    return (
      <Card padding="md" className={s.card}>
        <div className={s.empty}>Подбираем оптимальное время…</div>
      </Card>
    )
  }

  const [best, alt] = recommendations
  const totalMembers = members.length
  const memberById = new Map(members.map((m) => [m.id, m]))

  return (
    <Card padding="md" className={s.card}>
      <div className={s.header}>
        <div className={s.iconWrap}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M9 2v3M9 13v3M2 9h3M13 9h3M4.5 4.5l2 2M11.5 11.5l2 2M4.5 13.5l2-2M11.5 6.5l2-2"
              stroke="white"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div>
          <div className={s.title}>AI: лучшее время для встречи</div>
          <div className={s.subtitle}>Длительность: 1 час · Все участники</div>
        </div>
      </div>

      <SlotCard
        label="ЛУЧШИЙ ВАРИАНТ"
        slot={best}
        totalMembers={totalMembers}
        memberById={memberById}
        accent
      />

      {alt && (
        <SlotCard
          label="АЛЬТЕРНАТИВА"
          slot={alt}
          totalMembers={totalMembers}
          memberById={memberById}
        />
      )}

      <Button variant="accent" size="lg" fullWidth className={s.cta}>
        Создать встречу
      </Button>
    </Card>
  )
}

interface SlotCardProps {
  label: string
  slot: MeetingRecommendation
  totalMembers: number
  memberById: Map<string, Employee>
  accent?: boolean
}

function SlotCard({ label, slot, totalMembers, memberById, accent }: SlotCardProps) {
  const start = parseISO(slot.startDt)
  const end = parseISO(slot.endDt)
  const dateLine = format(start, 'EE d MMMM', { locale: ru })
  const time = `${format(start, 'HH:mm')} — ${format(end, 'HH:mm')}`

  const availableCount = slot.availableEmployeeIds.length
  const unavailable = slot.unavailableEmployeeIds
    .map((id) => memberById.get(id)?.fullName)
    .filter(Boolean) as string[]

  return (
    <div className={`${s.slot} ${accent ? s.slotAccent : ''}`}>
      <div className={s.slotLabel}>{label}</div>
      <div className={s.slotTitle}>
        {dateLine} · {time}
      </div>
      <div className={s.slotSubtitle}>
        Москва UTC+3 ·{' '}
        {availableCount === totalMembers
          ? 'без конфликтов'
          : `${unavailable.length} ${pluralizeRu(unavailable.length, ['конфликт', 'конфликта', 'конфликтов'])}`}
      </div>
      <div className={s.slotMeta}>
        {availableCount === totalMembers ? (
          <>✓ Доступны все {totalMembers} участников</>
        ) : (
          <>
            ⚠ {availableCount} из {totalMembers} участников
            {unavailable.length > 0 && (
              <span className={s.unavailable}> ({unavailable.join(', ')} — недоступны)</span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
