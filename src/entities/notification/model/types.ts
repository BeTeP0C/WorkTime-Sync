export type NotificationType = 'roadmap_actualization_request' | 'roadmap_status_changed' | string

export interface NotificationRaw {
  id: string
  recipient_id: string
  type: NotificationType
  title: string
  body: string
  payload: Record<string, unknown> | null
  related_roadmap_item_id: string | null
  read_at: string | null
  created_at: string
}

export interface AppNotification {
  id: string
  recipientId: string
  type: NotificationType
  title: string
  body: string
  payload: Record<string, unknown> | null
  relatedRoadmapItemId: string | null
  readAt: string | null
  createdAt: string
}
