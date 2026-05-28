'use client'

import { createContext, ReactNode, useCallback, useContext, useState } from 'react'

import { PromptDialog, PromptDialogProps } from './PromptDialog'

export type PromptOptions = Omit<PromptDialogProps, 'open' | 'onConfirm' | 'onCancel' | 'loading'>

type PromptFn = (opts: PromptOptions) => Promise<string | null>

const PromptContext = createContext<PromptFn | null>(null)

interface PendingPrompt {
  opts: PromptOptions
  resolve: (value: string | null) => void
}

export function PromptProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingPrompt | null>(null)

  const prompt = useCallback<PromptFn>((opts) => {
    return new Promise<string | null>((resolve) => {
      setPending({ opts, resolve })
    })
  }, [])

  const settle = (value: string | null): void => {
    setPending((prev) => {
      prev?.resolve(value)
      return null
    })
  }

  return (
    <PromptContext.Provider value={prompt}>
      {children}
      {pending && (
        <PromptDialog
          open
          {...pending.opts}
          onConfirm={(value) => settle(value)}
          onCancel={() => settle(null)}
        />
      )}
    </PromptContext.Provider>
  )
}

/**
 * Возвращает функцию-промпт. Resolved value:
 *  - `string` (включая пустую строку) — пользователь подтвердил
 *  - `null` — пользователь отменил (Esc, backdrop, кнопка «Отмена»)
 *
 * ВАЖНО: при `null` действие выполнять НЕ нужно — иначе получим зависший
 * pending-state серверной операции (см. кейс с window.prompt на /employees).
 */
export function usePrompt(): PromptFn {
  const ctx = useContext(PromptContext)
  if (!ctx) {
    throw new Error('usePrompt must be used inside <PromptProvider>')
  }
  return ctx
}
