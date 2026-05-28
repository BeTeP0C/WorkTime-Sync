import { ComponentType, SVGProps } from 'react'
import cn from 'classnames'

import {
  EXCEPTION_LABEL_RU,
  ExceptionType,
  ScheduleException,
} from '@/entities/exception/model/types'
import { ClockIcon, PencilIcon, PlaneIcon, PokerChipIcon, SnowflakeIcon } from '@/shared/icons'
import { formatDateRange } from '@/shared/lib/format'
import { Badge, BadgeTone } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'

import s from './ExceptionCard.module.scss'

const ICON_BY_TYPE: Record<ExceptionType, ComponentType<SVGProps<SVGSVGElement>>> = {
  vacation: PokerChipIcon,
  sick_leave: SnowflakeIcon,
  business_trip: PlaneIcon,
  personal_hours: ClockIcon,
}

interface Props {
  exception: ScheduleException
  muted?: boolean
  onEdit?: (exception: ScheduleException) => void
}

export function ExceptionCard({ exception, muted, onEdit }: Props) {
  const Icon = ICON_BY_TYPE[exception.type]
  const statusBadge = resolveStatusBadge(exception, muted)

  return (
    <div className={cn(s.card, muted && s.muted)}>
      <span className={cn(s.iconBg, s[`bg_${exception.type}`])}>
        <Icon width={20} height={20} />
      </span>

      <div className={s.body}>
        <div className={s.titleRow}>
          <span className={s.title}>{EXCEPTION_LABEL_RU[exception.type]}</span>
          <Badge tone={statusBadge.tone} size="sm" pill>
            {statusBadge.label}
          </Badge>
        </div>
        <div className={s.range}>{formatDateRange(exception.startDt, exception.endDt)}</div>
        {exception.reason && <div className={s.reason}>{exception.reason}</div>}
      </div>

      {onEdit && !muted && (
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<PencilIcon />}
          onClick={() => onEdit(exception)}
        >
          Изм.
        </Button>
      )}
    </div>
  )
}

function resolveStatusBadge(
  exception: ScheduleException,
  muted: boolean | undefined
): { tone: BadgeTone; label: string } {
  if (muted || exception.status === 'completed') {
    return { tone: 'neutral', label: 'Завершён' }
  }
  if (exception.status === 'active') {
    return { tone: 'success', label: 'Подтверждён' }
  }
  return { tone: 'info', label: 'Плановая' }
}
