import { API_URLS } from '@/shared/api/apiUrls'
import { apiClient } from '@/shared/api/client'

export interface SeedDemoPayload {
  small?: boolean
  reset?: boolean
  withRoadmap?: boolean
}

interface SeedDemoResponseRaw {
  employees_created: number
  teams_created: number
  schedules_created: number
  events_created: number
  metrics_created: number
  snapshots_created: number
  confirmation_requests_created: number
  roadmap_created: number
  roadmap_skipped: number
  took_ms: number
}

export interface SeedDemoResult {
  employeesCreated: number
  teamsCreated: number
  schedulesCreated: number
  eventsCreated: number
  metricsCreated: number
  snapshotsCreated: number
  confirmationRequestsCreated: number
  roadmapCreated: number
  roadmapSkipped: number
  tookMs: number
}

function normalize(raw: SeedDemoResponseRaw): SeedDemoResult {
  return {
    employeesCreated: raw.employees_created,
    teamsCreated: raw.teams_created,
    schedulesCreated: raw.schedules_created,
    eventsCreated: raw.events_created,
    metricsCreated: raw.metrics_created,
    snapshotsCreated: raw.snapshots_created,
    confirmationRequestsCreated: raw.confirmation_requests_created,
    roadmapCreated: raw.roadmap_created,
    roadmapSkipped: raw.roadmap_skipped,
    tookMs: raw.took_ms,
  }
}

export async function postSeedDemo(payload: SeedDemoPayload = {}): Promise<SeedDemoResult> {
  const raw = await apiClient<SeedDemoResponseRaw>('POST', API_URLS.adminSeedDemo(), {
    body: {
      small: payload.small ?? true,
      reset: payload.reset ?? true,
      with_roadmap: payload.withRoadmap ?? true,
    },
  })
  return normalize(raw)
}
