'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { ChatArrowDownIcon } from '@/shared/icons'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'

import s from './AiQuickAsk.module.scss'

interface AiQuickAskProps {
  /** Готовая «персональная» фраза от AI — показывается над textarea, до того как пользователь напишет вопрос. */
  hintText?: string
  /** Заголовок карточки. */
  title?: string
  /** Бейдж справа от заголовка («Новое», «Совет дня» и т.п.). */
  badge?: string
  /** Куда вести submit. По умолчанию — /assistant. */
  targetPath?: string
}

const PLACEHOLDER = 'Спросите AI о своём расписании, нагрузке или конфликтах…'

export function AiQuickAsk({
  hintText,
  title = 'AI-ассистент',
  badge,
  targetPath = '/assistant',
}: AiQuickAskProps) {
  const router = useRouter()
  const [value, setValue] = useState('')

  const submit = (): void => {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      router.push(targetPath)
      return
    }
    router.push(`${targetPath}?q=${encodeURIComponent(trimmed)}`)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <Card padding="lg" className={s.card}>
      <header className={s.header}>
        <div className={s.titleRow}>
          <span className={s.icon} aria-hidden>
            <ChatArrowDownIcon width={18} height={18} />
          </span>
          <span className={s.title}>{title}</span>
        </div>
        {badge && <span className={s.badge}>{badge}</span>}
      </header>

      {hintText && <div className={s.hint}>{hintText}</div>}

      <textarea
        className={s.textarea}
        placeholder={PLACEHOLDER}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        rows={2}
      />

      <Button variant="primary" size="md" fullWidth onClick={submit}>
        Отправить вопрос AI
      </Button>
    </Card>
  )
}
