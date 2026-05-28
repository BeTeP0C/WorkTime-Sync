'use client'

import { ScheduleDiagnostics } from '@/entities/schedule/api/diagnostics'
import { AlertBanner } from '@/shared/ui/AlertBanner'

interface Props {
  diagnostics: ScheduleDiagnostics
}

export function MismatchAlert({ diagnostics }: Props) {
  const { outsideEvents, totalEvents, outsideAfterHour, windowDays, hasTimezoneDrift } = diagnostics

  const body = buildBody({
    outsideEvents,
    totalEvents,
    outsideAfterHour,
    windowDays,
    hasTimezoneDrift,
  })

  return (
    <AlertBanner
      tone="error"
      icon={<span aria-hidden="true">⚠</span>}
      title="Обнаружено расхождение"
    >
      {body}
    </AlertBanner>
  )
}

function buildBody(args: {
  outsideEvents: number
  totalEvents: number
  outsideAfterHour: number | null
  windowDays: number
  hasTimezoneDrift: boolean
}): string {
  const { outsideEvents, totalEvents, outsideAfterHour, windowDays, hasTimezoneDrift } = args

  if (outsideEvents > 0 && outsideAfterHour !== null) {
    const tzNote = hasTimezoneDrift
      ? ' Возможно, ваш реальный рабочий день длиннее или вы работаете в другом часовом поясе.'
      : ' Проверьте границы рабочего дня.'
    return (
      `AI зафиксировал активность после ${String(outsideAfterHour).padStart(2, '0')}:00 ` +
      `в ${outsideEvents} из ${totalEvents} встреч за последние ${windowDays} дн.` +
      tzNote +
      ' При необходимости скорректируйте график.'
    )
  }
  if (outsideEvents > 0) {
    return (
      `AI нашёл ${outsideEvents} из ${totalEvents} встреч вне рабочих часов ` +
      `за последние ${windowDays} дн. Проверьте и при необходимости скорректируйте график.`
    )
  }
  return (
    'Данные о рабочем графике не обновлялись более 60 дней. ' +
    'Подтвердите актуальность или обновите параметры.'
  )
}
