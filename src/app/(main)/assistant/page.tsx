import { HrGuard } from '@/widgets/AuthGuard'

import { AssistantClient } from './AssistantClient'

export default function AssistantPage() {
  return (
    <HrGuard>
      <AssistantClient />
    </HrGuard>
  )
}
