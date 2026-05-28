import dynamic from 'next/dynamic'
import { createElement } from 'react'

// Lazy import recharts-виджета.
export const TeamTimeseriesCard = dynamic(
  () => import('./TeamTimeseriesCard').then((m) => m.TeamTimeseriesCard),
  {
    ssr: false,
    loading: () => createElement('div', { style: { minHeight: 240 } }),
  }
)
