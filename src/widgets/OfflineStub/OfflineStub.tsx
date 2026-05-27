import cn from 'classnames'

import { Button } from '@/shared/ui/Button'

import s from './OfflineStub.module.scss'

interface Props {
  onRetry?: () => void
  className?: string
}

export function OfflineStub({ onRetry, className }: Props) {
  return (
    <div className={cn(s.root, className)}>
      <div className={s.iconWrap}>
        <WifiOffSvg className={s.icon} />
      </div>
      <h1 className={s.title}>Нет подключения к интернету</h1>
      <p className={s.text}>
        Проверьте соединение и попробуйте снова. Ваши изменения сохранены и синхронизируются, как
        только связь восстановится.
      </p>
      <Button variant="primary" size="lg" onClick={onRetry} className={s.retryBtn}>
        Попробовать снова
      </Button>
    </div>
  )
}

function WifiOffSvg({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M8 8L88 88" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <path d="M48 76a6 6 0 100-12 6 6 0 000 12z" fill="currentColor" />
      <path
        d="M28 56c4.2-4.2 9.4-7 15-8.3M68 56c-2.4-2.4-5.1-4.4-8-5.9"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M14 42c5-5 11-8.7 17.6-10.9M82 42c-3-3-6.3-5.6-9.9-7.6"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  )
}
