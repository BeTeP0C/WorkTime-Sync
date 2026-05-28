'use client'

import { ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import cn from 'classnames'

import s from './Modal.module.scss'

export interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  labelledBy?: string
  size?: 'sm' | 'md'
  className?: string
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({ open, onClose, children, labelledBy, size = 'sm', className }: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    // Запомнили, кому возвращать фокус после закрытия модалки.
    previousFocusRef.current = (document.activeElement as HTMLElement | null) ?? null

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      // Простой focus trap: Tab/Shift+Tab крутятся по фокусируемым элементам
      // внутри modal'а, не убегая в фон.
      if (e.key === 'Tab' && contentRef.current) {
        const focusable = Array.from(
          contentRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1)
        if (focusable.length === 0) {
          e.preventDefault()
          contentRef.current.focus()
          return
        }
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        const active = document.activeElement as HTMLElement | null
        if (e.shiftKey && active === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKey)

    // Перенесём фокус в модалку (на первый focusable, иначе на сам контейнер).
    const focusable = contentRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
    ;(focusable ?? contentRef.current)?.focus()

    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = previousOverflow
      // Возвращаем фокус туда, откуда его взяли (если элемент ещё в DOM).
      const previous = previousFocusRef.current
      if (previous && document.body.contains(previous)) {
        previous.focus()
      }
    }
  }, [open, onClose])

  if (!open) return null
  if (typeof window === 'undefined') return null

  return createPortal(
    <div
      className={s.backdrop}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={contentRef}
        tabIndex={-1}
        className={cn(s.content, s[`size_${size}`], className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}
