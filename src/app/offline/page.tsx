'use client'

import { OfflineStub } from '@/widgets/OfflineStub'

import s from './page.module.scss'

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className={s.root}>
      <OfflineStub onRetry={handleRetry} />
    </div>
  )
}
