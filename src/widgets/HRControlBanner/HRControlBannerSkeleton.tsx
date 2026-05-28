import { Skeleton } from '@/shared/ui/Skeleton'

import s from './HRControlBannerSkeleton.module.scss'

export function HRControlBannerSkeleton() {
  return (
    <div className={s.banner}>
      <Skeleton className={s.icon} radius="md" />
      <div className={s.text}>
        <Skeleton className={s.titleLine} radius="sm" />
        <Skeleton className={s.descLine} radius="sm" />
      </div>
      <Skeleton className={s.action} radius="md" />
    </div>
  )
}
