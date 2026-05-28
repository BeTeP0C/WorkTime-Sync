import { Metadata } from 'next'

import { VkCallbackClient } from './VkCallbackClient'

export const metadata: Metadata = {
  title: 'Вход через VK · WorkTime Sync',
}

export default function VkCallbackPage() {
  return <VkCallbackClient />
}
