import { API_URLS } from '@/shared/api/apiUrls'
import { apiClient } from '@/shared/api/client'

import { ActivityEventImportResult, ActivityEventImportResultRaw } from '../model/types'

function normalize(raw: ActivityEventImportResultRaw): ActivityEventImportResult {
  return {
    importedCount: raw.imported_count,
    skippedDuplicateCount: raw.skipped_duplicate_count,
    errors: raw.errors,
  }
}

export async function uploadActivityEventsCsv(file: File): Promise<ActivityEventImportResult> {
  const formData = new FormData()
  formData.append('file', file)
  const raw = await apiClient<ActivityEventImportResultRaw>('POST', API_URLS.importEventsCsv(), {
    body: formData,
  })
  return normalize(raw)
}

export async function uploadActivityEventsJson(
  payload: unknown[]
): Promise<ActivityEventImportResult> {
  const raw = await apiClient<ActivityEventImportResultRaw>('POST', API_URLS.importEventsJson(), {
    body: payload,
  })
  return normalize(raw)
}
