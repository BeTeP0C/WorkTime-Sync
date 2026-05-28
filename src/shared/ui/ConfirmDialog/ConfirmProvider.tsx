'use client'

import { createContext, ReactNode, useCallback, useContext, useState } from 'react'

import { ConfirmDialog, ConfirmDialogProps } from './ConfirmDialog'

export type ConfirmOptions = Omit<ConfirmDialogProps, 'open' | 'onConfirm' | 'onCancel' | 'loading'>

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

interface PendingConfirm {
  opts: ConfirmOptions
  resolve: (ok: boolean) => void
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)

  const confirm = useCallback<ConfirmFn>((opts) => {
    return new Promise<boolean>((resolve) => {
      setPending({ opts, resolve })
    })
  }, [])

  const settle = (ok: boolean) => {
    setPending((prev) => {
      prev?.resolve(ok)
      return null
    })
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <ConfirmDialog
          open
          {...pending.opts}
          onConfirm={() => settle(true)}
          onCancel={() => settle(false)}
        />
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) {
    throw new Error('useConfirm must be used inside <ConfirmProvider>')
  }
  return ctx
}
