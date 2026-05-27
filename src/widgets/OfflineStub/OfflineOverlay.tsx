'use client'

import { useEffect, useState } from 'react'

import { useOnlineStatus } from '@/shared/hooks'

import { OfflineStub } from './OfflineStub'

import s from './OfflineOverlay.module.scss'

export function OfflineOverlay() {
  const online = useOnlineStatus()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!online) {
      setDismissed(false)
    }
  }, [online])

  const visible = !online && !dismissed

  useEffect(() => {
    if (!visible) return

    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = prev
    }
  }, [visible])

  if (!visible) return null

  const handleRetry = () => {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      setDismissed(true)
    }
  }

  return (
    <div className={s.overlay} role="dialog" aria-modal="true" aria-live="assertive">
      <OfflineStub onRetry={handleRetry} />
    </div>
  )
}
