import Link from 'next/link'
import { ReactNode } from 'react'

import { ArrowSmallRightIcon, ShieldCheckIcon } from '@/shared/icons'

import s from './HRControlBanner.module.scss'

interface HRControlBannerProps {
  title: ReactNode
  description: ReactNode
  actionLabel?: string
  actionHref?: string
}

export function HRControlBanner({
  title,
  description,
  actionLabel,
  actionHref,
}: HRControlBannerProps) {
  return (
    <div className={s.banner}>
      <div className={s.iconWrap}>
        <ShieldCheckIcon width={20} height={20} />
      </div>
      <div className={s.text}>
        <div className={s.title}>{title}</div>
        <div className={s.description}>{description}</div>
      </div>
      {actionLabel && actionHref && (
        <Link href={actionHref} className={s.action}>
          {actionLabel}
          <ArrowSmallRightIcon width={16} height={16} />
        </Link>
      )}
    </div>
  )
}
