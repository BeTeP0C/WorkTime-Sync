import { RecommendationCode } from '@/entities/recommendation/model/types'

export type RoadmapStatus =
  | 'pending'
  | 'requested'
  | 'acknowledged'
  | 'updated'
  | 'completed'
  | 'deferred'
  | 'ignored'
  | 'dismissed'

export type RoadmapSeverity = 'critical' | 'high' | 'medium' | 'low'

export type RoadmapSubject = 'employee' | 'team'

export type BadgeTone = 'critical' | 'high' | 'medium' | 'success' | 'warning'

export interface RoadmapItemRaw {
  id: string
  subject_type: RoadmapSubject
  subject_id: string
  employee_id: string | null
  team_id: string | null
  recommendation_code: RecommendationCode | string
  title: string
  severity: RoadmapSeverity
  reason: string
  action: string
  priority_score: number
  status: RoadmapStatus
  notes: string | null
  due_at: string | null
  requested_at: string | null
  acknowledged_at: string | null
  completed_at: string | null
  assigned_to_id: string | null
  created_by_id: string | null
  confirmation_request_id: string | null
  metric_snapshot: Record<string, unknown> | null
  created_at: string
  updated_at: string
  subject_name: string | null
  subject_avatar_url: string | null
}

export interface RoadmapItem {
  id: string
  subjectType: RoadmapSubject
  subjectId: string
  employeeId: string | null
  teamId: string | null
  recommendationCode: RecommendationCode | string
  title: string
  severity: RoadmapSeverity
  reason: string
  action: string
  priorityScore: number
  status: RoadmapStatus
  notes: string | null
  dueAt: string | null
  requestedAt: string | null
  acknowledgedAt: string | null
  completedAt: string | null
  assignedToId: string | null
  createdById: string | null
  confirmationRequestId: string | null
  metricSnapshot: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  subjectName: string | null
  subjectAvatarUrl: string | null
}

export interface RoadmapListResponseRaw {
  items: RoadmapItemRaw[]
  total: number
  counts_by_status: Record<string, number>
  counts_by_severity: Record<string, number>
}

export interface RoadmapListResponse {
  items: RoadmapItem[]
  total: number
  countsByStatus: Record<RoadmapStatus, number>
  countsBySeverity: Record<RoadmapSeverity, number>
}

export interface RoadmapGenerateResponseRaw {
  created: number
  skipped: number
  items: RoadmapItemRaw[]
}

export interface RoadmapGenerateResponse {
  created: number
  skipped: number
  items: RoadmapItem[]
}

export const ROADMAP_STATUS_LABEL_RU: Record<RoadmapStatus, string> = {
  pending: 'Запланировано',
  requested: 'Запрос отправлен',
  acknowledged: 'Подтверждено',
  updated: 'Обновлено',
  completed: 'Завершено',
  deferred: 'Отложено',
  ignored: 'Игнорировано',
  dismissed: 'Отклонено',
}

export const ROADMAP_STATUS_TONE: Record<RoadmapStatus, BadgeTone> = {
  pending: 'medium',
  requested: 'warning',
  acknowledged: 'high',
  updated: 'success',
  completed: 'success',
  deferred: 'medium',
  ignored: 'medium',
  dismissed: 'medium',
}

export const ROADMAP_SEVERITY_LABEL_RU: Record<RoadmapSeverity, string> = {
  critical: 'Срочно',
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
}

export const ROADMAP_SEVERITY_TONE: Record<RoadmapSeverity, BadgeTone> = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'medium',
}

export const ROADMAP_STATUS_ORDER: RoadmapStatus[] = [
  'pending',
  'requested',
  'acknowledged',
  'updated',
  'completed',
  'deferred',
  'ignored',
  'dismissed',
]

export const ROADMAP_SEVERITY_ORDER: RoadmapSeverity[] = ['critical', 'high', 'medium', 'low']

const STATUS_TRANSITIONS: Record<RoadmapStatus, RoadmapStatus[]> = {
  pending: ['requested', 'deferred', 'ignored', 'dismissed', 'completed'],
  requested: ['acknowledged', 'completed', 'deferred'],
  acknowledged: ['updated', 'completed', 'deferred'],
  updated: ['completed'],
  deferred: ['pending', 'requested', 'ignored', 'dismissed'],
  completed: [],
  ignored: [],
  dismissed: [],
}

export function getAvailableTransitions(status: RoadmapStatus): RoadmapStatus[] {
  return STATUS_TRANSITIONS[status]
}
