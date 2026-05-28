import dynamic from 'next/dynamic'
import { createElement } from 'react'

// Lazy import: маленький line-chart, но всё равно тянет recharts.
export const RecommendationWeeklyChart = dynamic(
  () => import('./RecommendationWeeklyChart').then((m) => m.RecommendationWeeklyChart),
  {
    ssr: false,
    loading: () => createElement('div', { style: { minHeight: 160 } }),
  }
)
