'use client'

import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

import { ConfirmProvider } from '@/shared/ui/ConfirmDialog'
import { PromptProvider } from '@/shared/ui/PromptDialog'

import { RootStore } from './RootStore'

const RootStoreContext = createContext<RootStore | null>(null)

interface RootStoreProviderProps {
  children: ReactNode
}

export function RootStoreProvider({ children }: RootStoreProviderProps) {
  const [store] = useState(() => new RootStore())
  // На HMR/unmount чистим window-listener'ы и refresh-таймеры — иначе они
  // накапливаются (см. AuthStore.dispose()).
  useEffect(() => {
    return () => {
      store.dispose()
    }
  }, [store])
  return (
    <RootStoreContext.Provider value={store}>
      <ConfirmProvider>
        <PromptProvider>{children}</PromptProvider>
      </ConfirmProvider>
    </RootStoreContext.Provider>
  )
}

export function useRootStore(): RootStore {
  const ctx = useContext(RootStoreContext)
  if (!ctx) {
    throw new Error('useRootStore must be used inside <RootStoreProvider>')
  }
  return ctx
}

export function useEmployeesStore() {
  return useRootStore().employeesStore
}

export function useTeamsStore() {
  return useRootStore().teamsStore
}

export function useDashboardStore() {
  return useRootStore().dashboardStore
}

export function useAnalyticsStore() {
  return useRootStore().analyticsStore
}

export function useAuthStore() {
  return useRootStore().authStore
}

export function useRecommendationsStore() {
  return useRootStore().recommendationsStore
}

export function useNotificationsStore() {
  return useRootStore().notificationsStore
}

export function useRoadmapStore() {
  return useRootStore().roadmapStore
}

export function useConflictsStore() {
  return useRootStore().conflictsStore
}
