import { API_URLS } from '@/shared/api/apiUrls'
import { apiClient } from '@/shared/api/client'

import { AppNotification, NotificationRaw } from '../model/types'

export function normalizeNotification(raw: NotificationRaw): AppNotification {
  return {
    id: raw.id,
    recipientId: raw.recipient_id,
    type: raw.type,
    title: raw.title,
    body: raw.body,
    payload: raw.payload,
    relatedRoadmapItemId: raw.related_roadmap_item_id,
    readAt: raw.read_at,
    createdAt: raw.created_at,
  }
}

export interface NotificationsQuery {
  unreadOnly?: boolean
  limit?: number
  offset?: number
}

export async function getNotifications(params?: NotificationsQuery): Promise<AppNotification[]> {
  const query: Record<string, unknown> = {}
  if (params?.unreadOnly !== undefined) query.unread_only = params.unreadOnly
  if (params?.limit !== undefined) query.limit = params.limit
  if (params?.offset !== undefined) query.offset = params.offset
  const data = await apiClient<NotificationRaw[]>('GET', API_URLS.notifications(), {
    query: Object.keys(query).length > 0 ? query : undefined,
  })
  return data.map(normalizeNotification)
}

export async function markNotificationAsRead(id: string): Promise<AppNotification> {
  const raw = await apiClient<NotificationRaw>('PATCH', API_URLS.notificationRead(id))
  return normalizeNotification(raw)
}
