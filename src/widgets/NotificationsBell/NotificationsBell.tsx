'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'

import { useAuthStore, useNotificationsStore } from '@/app-store/context'
import { ScheduleConfirmationRequest } from '@/entities/confirmation/model/types'
import { BellIcon } from '@/shared/icons'
import { formatDateMonth } from '@/shared/lib/format'

import s from './NotificationsBell.module.scss'

const DROPDOWN_LIMIT = 5

export const NotificationsBell = observer(function NotificationsBell() {
  const auth = useAuthStore()
  const notifications = useNotificationsStore()
  const rootRef = useRef<HTMLDivElement>(null)
  const [isOpen, setOpen] = useState(false)

  const userId = auth.currentUser.value?.id ?? null

  useEffect(() => {
    if (!userId) return
    void notifications.loadForCurrentUser(userId)
  }, [userId, notifications])

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  if (!userId) return null

  const pending = notifications.requests.value.filter((r) => r.status === 'pending')
  const visible: ScheduleConfirmationRequest[] = pending.slice(0, DROPDOWN_LIMIT)
  const unreadCount = pending.length

  const handleConfirm = async () => {
    await notifications.confirm(userId)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={s.root}>
      <button
        type="button"
        className={s.bell}
        aria-label={`Уведомления${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
        aria-expanded={isOpen}
        onClick={() => setOpen((v) => !v)}
      >
        <BellIcon className={s.bellIcon} />
        {unreadCount > 0 && <span className={s.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className={s.dropdown} role="menu">
          <div className={s.dropdownHeader}>
            <span className={s.dropdownTitle}>Уведомления</span>
            <span className={s.dropdownCount}>
              {unreadCount > 0 ? `${unreadCount} новых` : 'Нет новых'}
            </span>
          </div>
          {visible.length === 0 ? (
            <div className={s.empty}>Все запросы обработаны.</div>
          ) : (
            <ul className={s.list}>
              {visible.map((request) => (
                <li key={request.id} className={s.item}>
                  <div className={s.itemTitle}>
                    {request.requestedByName ?? 'Система'} запрашивает подтверждение графика
                  </div>
                  <div className={s.itemMeta}>{formatDateMonth(request.createdAt)}</div>
                  {request.reason && <div className={s.itemReason}>{request.reason}</div>}
                </li>
              ))}
            </ul>
          )}
          <div className={s.dropdownFooter}>
            {visible.length > 0 && (
              <button type="button" className={s.confirmBtn} onClick={handleConfirm}>
                Подтвердить мой график
              </button>
            )}
            <Link href="/notifications" className={s.viewAll} onClick={() => setOpen(false)}>
              Все уведомления
            </Link>
          </div>
        </div>
      )}
    </div>
  )
})
