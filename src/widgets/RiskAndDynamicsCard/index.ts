// Lazy-обёртка для тяжёлого виджета на recharts (~150KB gzip).
// Recharts грузится только после hydration → не блокирует FCP/TTI.
import dynamic from 'next/dynamic'
import { createElement } from 'react'

import { RiskAndDynamicsCardSkeleton } from './RiskAndDynamicsCardSkeleton'

export const RiskAndDynamicsCard = dynamic(
  () => import('./RiskAndDynamicsCard').then((m) => m.RiskAndDynamicsCard),
  {
    ssr: false,
    loading: () => createElement(RiskAndDynamicsCardSkeleton),
  }
)

export { RiskAndDynamicsCardSkeleton }
