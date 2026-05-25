import Link from 'next/link'
import { ReactNode } from 'react'

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
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 2v3M10 15v3M2 10h3M15 10h3M4.93 4.93l2.12 2.12M12.95 12.95l2.12 2.12M4.93 15.07l2.12-2.12M12.95 7.05l2.12-2.12"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className={s.text}>
        <div className={s.title}>{title}</div>
        <div className={s.description}>{description}</div>
      </div>
      {actionLabel && actionHref && (
        <Link href={actionHref} className={s.action}>
          {actionLabel} →
        </Link>
      )}
    </div>
  )
}
