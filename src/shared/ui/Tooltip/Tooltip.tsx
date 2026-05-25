'use client'

import 'tippy.js/dist/tippy.css'

import { ReactElement, ReactNode } from 'react'
import Tippy from '@tippyjs/react'

interface TooltipProps {
  content: ReactNode
  children: ReactElement
  placement?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number | [number, number]
  disabled?: boolean
}

export function Tooltip({
  content,
  children,
  placement = 'top',
  delay = [200, 0],
  disabled,
}: TooltipProps) {
  return (
    <Tippy
      content={content}
      placement={placement}
      delay={delay}
      disabled={disabled}
      arrow
      animation="shift-away"
    >
      {children}
    </Tippy>
  )
}
