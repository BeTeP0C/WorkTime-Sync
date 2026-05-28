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

export function Modal({ open, onClose, children, labelledBy, size = 'sm', className }: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = previousOverflow
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
