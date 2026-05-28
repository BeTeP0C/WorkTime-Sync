import { API_URLS } from '@/shared/api/apiUrls'
import { apiClient } from '@/shared/api/client'

import {
  RoadmapGenerateResponse,
  RoadmapGenerateResponseRaw,
  RoadmapItem,
  RoadmapItemRaw,
  RoadmapListResponse,
  RoadmapListResponseRaw,
  RoadmapSeverity,
  RoadmapStatus,
} from '../model/types'

export interface RoadmapQuery {
  status?: RoadmapStatus[]
  severity?: RoadmapSeverity[]
  subjectType?: 'employee' | 'team' | null
  teamId?: string | null
  employeeId?: string | null
  assignedToId?: string | null
  search?: string | null
  includeClosed?: boolean
  limit?: number
  offset?: number
}

export function normalizeRoadmapItem(raw: RoadmapItemRaw): RoadmapItem {
  return {
    id: raw.id,
    subjectType: raw.subject_type,
    subjectId: raw.subject_id,
    employeeId: raw.employee_id,
    teamId: raw.team_id,
    recommendationCode: raw.recommendation_code,
    title: raw.title,
    severity: raw.severity,
    reason: raw.reason,
    action: raw.action,
    priorityScore: raw.priority_score,
    status: raw.status,
    notes: raw.notes,
    dueAt: raw.due_at,
    requestedAt: raw.requested_at,
    acknowledgedAt: raw.acknowledged_at,
    completedAt: raw.completed_at,
    assignedToId: raw.assigned_to_id,
    createdById: raw.created_by_id,
    confirmationRequestId: raw.confirmation_request_id,
    metricSnapshot: raw.metric_snapshot,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    subjectName: raw.subject_name,
    subjectAvatarUrl: raw.subject_avatar_url,
  }
}

function emptyCounts<K extends string>(keys: readonly K[]): Record<K, number> {
  return keys.reduce(
    (acc, key) => {
      acc[key] = 0
      return acc
    },
    {} as Record<K, number>
  )
}

function mergeCounts<K extends string>(
  source: Record<string, number>,
  keys: readonly K[]
): Record<K, number> {
  const base = emptyCounts(keys)
  for (const key of keys) {
    if (source[key] !== undefined) base[key] = source[key]
  }
  return base
}

export function normalizeRoadmapList(raw: RoadmapListResponseRaw): RoadmapListResponse {
  return {
    items: raw.items.map(normalizeRoadmapItem),
    total: raw.total,
    countsByStatus: mergeCounts(raw.counts_by_status, [
      'pending',
      'requested',
      'acknowledged',
      'updated',
      'completed',
      'deferred',
      'ignored',
      'dismissed',
    ] as const),
    countsBySeverity: mergeCounts(raw.counts_by_severity, [
      'critical',
      'high',
      'medium',
      'low',
    ] as const),
  }
}

function buildQuery(params?: RoadmapQuery): Record<string, unknown> | undefined {
  if (!params) return undefined
  const query: Record<string, unknown> = {}
  if (params.status?.length) query.status = params.status
  if (params.severity?.length) query.severity = params.severity
  if (params.subjectType) query.subject_type = params.subjectType
  if (params.teamId) query.team_id = params.teamId
  if (params.employeeId) query.employee_id = params.employeeId
  if (params.assignedToId) query.assigned_to_id = params.assignedToId
  if (params.search) query.search = params.search
  if (params.includeClosed !== undefined) query.include_closed = params.includeClosed
  if (params.limit !== undefined) query.limit = params.limit
  if (params.offset !== undefined) query.offset = params.offset
  return Object.keys(query).length > 0 ? query : undefined
}

export async function getRoadmap(params?: RoadmapQuery): Promise<RoadmapListResponse> {
  const data = await apiClient<RoadmapListResponseRaw>('GET', API_URLS.roadmap(), {
    query: buildQuery(params),
  })
  return normalizeRoadmapList(data)
}

export async function getTeamRoadmap(
  teamId: string,
  params?: RoadmapQuery
): Promise<RoadmapListResponse> {
  const data = await apiClient<RoadmapListResponseRaw>('GET', API_URLS.teamRoadmap(teamId), {
    query: buildQuery(params),
  })
  return normalizeRoadmapList(data)
}

export async function getEmployeeRoadmap(
  employeeId: string,
  params?: RoadmapQuery
): Promise<RoadmapListResponse> {
  const data = await apiClient<RoadmapListResponseRaw>(
    'GET',
    API_URLS.employeeRoadmap(employeeId),
    { query: buildQuery(params) }
  )
  return normalizeRoadmapList(data)
}

export async function updateRoadmapStatus(
  id: string,
  status: RoadmapStatus,
  notes?: string
): Promise<RoadmapItem> {
  const raw = await apiClient<RoadmapItemRaw>('PATCH', API_URLS.roadmapItemStatus(id), {
    body: { status, ...(notes !== undefined ? { notes } : {}) },
  })
  return normalizeRoadmapItem(raw)
}

export async function updateRoadmapItem(
  id: string,
  payload: { notes?: string; assignedToId?: string; dueAt?: string }
): Promise<RoadmapItem> {
  const raw = await apiClient<RoadmapItemRaw>('PATCH', API_URLS.roadmapItem(id), {
    body: {
      ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
      ...(payload.assignedToId !== undefined ? { assigned_to_id: payload.assignedToId } : {}),
      ...(payload.dueAt !== undefined ? { due_at: payload.dueAt } : {}),
    },
  })
  return normalizeRoadmapItem(raw)
}

export async function generateRoadmap(scope?: {
  teamId?: string
  employeeId?: string
}): Promise<RoadmapGenerateResponse> {
  const raw = await apiClient<RoadmapGenerateResponseRaw>('POST', API_URLS.roadmapGenerate(), {
    body: {
      ...(scope?.teamId ? { team_id: scope.teamId } : {}),
      ...(scope?.employeeId ? { employee_id: scope.employeeId } : {}),
    },
  })
  return {
    created: raw.created,
    skipped: raw.skipped,
    items: raw.items.map(normalizeRoadmapItem),
  }
}

export async function deleteRoadmapItem(id: string): Promise<void> {
  await apiClient<void>('DELETE', API_URLS.roadmapItem(id))
}
