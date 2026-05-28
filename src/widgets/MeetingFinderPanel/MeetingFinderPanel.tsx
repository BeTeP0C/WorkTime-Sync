'use client'

import { useState } from 'react'
import cn from 'classnames'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

import { askAi } from '@/entities/ai/api'
import { Employee } from '@/entities/employee/model/types'
import { MeetingRecommendation } from '@/entities/team/model/types'
import { SparkleIcon } from '@/shared/icons'
import { pluralizeRu } from '@/shared/lib/format'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'

import s from './MeetingFinderPanel.module.scss'

export type MeetingFinderStatus = 'initial' | 'loading' | 'success' | 'error'

interface MeetingFinderPanelProps {
  recommendations: MeetingRecommendation[]
  members: Employee[]
  loadingStatus: MeetingFinderStatus
  onRetry: () => void
  teamId?: string | null
  teamName?: string | null
}

type ExplainState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; text: string }
  | { status: 'error'; message: string }

export function MeetingFinderPanel({
  recommendations,
  members,
  loadingStatus,
  onRetry,
  teamId,
  teamName,
}: MeetingFinderPanelProps) {
  const [explainBySlot, setExplainBySlot] = useState<Record<string, ExplainState>>({})

  const hasRecommendations = recommendations.length > 0
  const isLoading = loadingStatus === 'loading'

  // Loading без ранее полученных данных — чистый плейсхолдер со спиннером.
  if (isLoading && !hasRecommendations) {
    return (
      <Card padding="md" className={s.card}>
        <div className={s.statusBlock}>
          <div className={s.spinner} aria-hidden />
          <div className={s.statusText}>Подбираем оптимальное время…</div>
        </div>
      </Card>
    )
  }

  // Ошибка без ранее полученных данных — текст + retry.
  if (loadingStatus === 'error' && !hasRecommendations) {
    return (
      <Card padding="md" className={s.card}>
        <div className={s.statusBlock}>
          <div className={s.statusTitle}>Не удалось подобрать окно</div>
          <div className={s.statusHint}>
            Проверьте соединение или повторите попытку через несколько секунд.
          </div>
          <Button variant="secondary" size="md" onClick={onRetry} className={s.retryButton}>
            Попробовать снова
          </Button>
        </div>
      </Card>
    )
  }

  // Успех, но 0 окон — явный empty-state.
  if (!hasRecommendations) {
    return (
      <Card padding="md" className={s.card}>
        <div className={s.statusBlock}>
          <div className={s.statusTitle}>Нет общих окон на этой неделе</div>
          <div className={s.statusHint}>
            Попробуйте сменить неделю в расписании ниже или сократить длительность встречи.
          </div>
          <Button variant="secondary" size="md" onClick={onRetry} className={s.retryButton}>
            Подобрать заново
          </Button>
        </div>
      </Card>
    )
  }

  const [best, alt] = recommendations
  const totalMembers = members.length
  const memberById = new Map(members.map((m) => [m.id, m]))

  const handleExplain = async (
    slotKey: string,
    slot: MeetingRecommendation,
    isBest: boolean
  ): Promise<void> => {
    const current = explainBySlot[slotKey]
    if (current?.status === 'success' || current?.status === 'loading') return
    setExplainBySlot((prev) => ({ ...prev, [slotKey]: { status: 'loading' } }))
    try {
      const start = parseISO(slot.startDt)
      const end = parseISO(slot.endDt)
      const date = format(start, 'EE d MMMM', { locale: ru })
      const time = `${format(start, 'HH:mm')}–${format(end, 'HH:mm')}`
      const question =
        `Объясни кратко (1–2 предложения), почему встреча ${date} ${time} — ` +
        `${isBest ? 'лучший' : 'альтернативный'} вариант для команды ` +
        `${teamName ? `«${teamName}»` : ''}. Учти доступность участников, ` +
        `часовые пояса и существующие события календаря.`
      const response = await askAi({
        question,
        teamId: teamId ?? null,
        useRag: true,
      })
      const text = response.summary || response.answer || 'AI не смог сформулировать объяснение.'
      setExplainBySlot((prev) => ({ ...prev, [slotKey]: { status: 'success', text } }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось получить объяснение.'
      setExplainBySlot((prev) => ({ ...prev, [slotKey]: { status: 'error', message } }))
    }
  }

  return (
    <Card padding="md" className={cn(s.card, isLoading && s.cardReloading)}>
      {/* Reload-overlay: повторный поиск поверх уже отрисованных слотов. */}
      {isLoading && (
        <div className={s.reloadOverlay} aria-live="polite">
          <div className={s.spinner} aria-hidden />
          <div className={s.statusText}>Обновляем подборку…</div>
        </div>
      )}

      <div className={s.header}>
        <div className={s.iconWrap}>
          <SparkleIcon style={{ color: 'white' }} aria-hidden />
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
        explainState={explainBySlot['best'] ?? { status: 'idle' }}
        onExplain={() => handleExplain('best', best, true)}
      />

      {alt && (
        <SlotCard
          label="АЛЬТЕРНАТИВА"
          slot={alt}
          totalMembers={totalMembers}
          memberById={memberById}
          explainState={explainBySlot['alt'] ?? { status: 'idle' }}
          onExplain={() => handleExplain('alt', alt, false)}
        />
      )}

      <Button
        variant="accent"
        size="lg"
        fullWidth
        className={s.cta}
        onClick={() => openGoogleCalendarDraft(best, teamName, members)}
      >
        Создать встречу
      </Button>
    </Card>
  )
}

/**
 * Открывает Google Calendar в новой вкладке с подготовленным draft-событием.
 * Без интеграции с конкретным календарём пользователя (это пост-MVP) —
 * deep-link работает в любом аккаунте, дальше пользователь подтверждает гостей.
 */
function openGoogleCalendarDraft(
  slot: MeetingRecommendation,
  teamName: string | null | undefined,
  members: Employee[]
): void {
  const start = parseISO(slot.startDt)
  const end = parseISO(slot.endDt)
  const fmt = (d: Date): string =>
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}T${String(d.getUTCHours()).padStart(2, '0')}${String(d.getUTCMinutes()).padStart(2, '0')}00Z`
  const title = teamName ? `Встреча команды «${teamName}»` : 'Встреча команды'
  const dates = `${fmt(start)}/${fmt(end)}`
  const memberEmails = members
    .map((m) => m.email)
    .filter((email): email is string => !!email)
    .join(',')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates,
    details: 'Подобрано AI WorkTime Sync — лучшее окно для всей команды.',
  })
  if (memberEmails) params.set('add', memberEmails)
  const url = `https://calendar.google.com/calendar/render?${params.toString()}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

interface SlotCardProps {
  label: string
  slot: MeetingRecommendation
  totalMembers: number
  memberById: Map<string, Employee>
  accent?: boolean
  explainState: ExplainState
  onExplain: () => void
}

function SlotCard({
  label,
  slot,
  totalMembers,
  memberById,
  accent,
  explainState,
  onExplain,
}: SlotCardProps) {
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

      <button
        type="button"
        className={s.explainToggle}
        onClick={onExplain}
        disabled={explainState.status === 'loading'}
      >
        {renderExplainCta(explainState)}
      </button>
      {explainState.status === 'success' && (
        <div className={s.explainBody}>{explainState.text}</div>
      )}
      {explainState.status === 'error' && (
        <div className={`${s.explainBody} ${s.explainError}`}>{explainState.message}</div>
      )}
    </div>
  )
}

function renderExplainCta(state: ExplainState): string {
  switch (state.status) {
    case 'loading':
      return '🤖 AI думает…'
    case 'success':
      return '🤖 Объяснение получено'
    case 'error':
      return '🤖 Попробовать снова'
    default:
      return '🤖 Почему AI выбрал этот вариант?'
  }
}
