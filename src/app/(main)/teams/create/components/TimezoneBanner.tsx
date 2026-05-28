import { InfoIcon } from '@/shared/icons'

import s from './TimezoneBanner.module.scss'

interface TimezoneBannerProps {
  message: string
}

export function TimezoneBanner({ message }: TimezoneBannerProps) {
  return (
    <div className={s.banner} role="status">
      <span className={s.icon}>
        <InfoIcon />
      </span>
      <span className={s.text}>{message}</span>
    </div>
  )
}
