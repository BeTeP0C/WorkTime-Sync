import { HrOrAnalystGuard } from '@/widgets/AuthGuard'

import { RoadmapClient } from './RoadmapClient'

export default function RoadmapPage() {
  return (
    <HrOrAnalystGuard>
      <RoadmapClient />
    </HrOrAnalystGuard>
  )
}
