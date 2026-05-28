import dynamic from 'next/dynamic'
import { createElement } from 'react'

// Lazy import recharts-виджета: грузится только при попадании на /metrics,
// не утяжеляя другие страницы.
export const RiskDistributionHistoryCard = dynamic(
  () => import('./RiskDistributionHistoryCard').then((m) => m.RiskDistributionHistoryCard),
  {
    ssr: false,
    loading: () => createElement('div', { style: { minHeight: 280 } }),
  }
)
