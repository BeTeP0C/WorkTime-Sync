import Link from 'next/link'
import { ReactNode } from 'react'

import { ArrowSmallRightIcon, DashboardsIcon } from '@/shared/icons'

import s from './AIBanner.module.scss'

interface AIBannerProps {
  title: ReactNode
  description: ReactNode
  actionLabel?: string
  actionHref?: string
}

export function AIBanner({ title, description, actionLabel, actionHref }: AIBannerProps) {
  return (
    <div className={s.banner}>
      <div className={s.iconWrap}>
        <DashboardsIcon width={24} height={24} />
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
