import { API_URLS } from '@/shared/api/apiUrls'
import { apiClient } from '@/shared/api/client'

import {
  ConfirmationStatus,
  ScheduleConfirmationRequest,
  ScheduleConfirmationRequestRaw,
  ScheduleConfirmResponseRaw,
  ScheduleConfirmResult,
} from '../model/types'

function normalizeRequest(raw: ScheduleConfirmationRequestRaw): ScheduleConfirmationRequest {
  return {
    id: raw.id,
    employeeId: raw.employee_id,
    requestedById: raw.requested_by_id,
    requestedByName: raw.requested_by_name,
    employeeName: raw.employee_name,
    reason: raw.reason,
    status: raw.status,
    createdAt: raw.created_at,
    respondedAt: raw.responded_at,
    responseNote: raw.response_note,
  }
}

export async function confirmEmployeeSchedule(employeeId: string): Promise<ScheduleConfirmResult> {
  const data = await apiClient<ScheduleConfirmResponseRaw>(
    'POST',
    API_URLS.employeeScheduleConfirm(employeeId)
  )
  return {
    confirmedAt: data.confirmed_at,
    closedRequestIds: data.closed_request_ids,
  }
}

export async function createConfirmationRequest(
  employeeId: string,
  reason: string | null
): Promise<ScheduleConfirmationRequest> {
  const data = await apiClient<ScheduleConfirmationRequestRaw>(
    'POST',
    API_URLS.employeeConfirmationRequests(employeeId),
    { body: { reason } }
  )
  return normalizeRequest(data)
}

export async function getConfirmationRequests(
  employeeId: string,
  status?: ConfirmationStatus
): Promise<ScheduleConfirmationRequest[]> {
  const data = await apiClient<ScheduleConfirmationRequestRaw[]>(
    'GET',
    API_URLS.employeeConfirmationRequests(employeeId),
    { query: status ? { status } : undefined }
  )
  return data.map(normalizeRequest)
}

export async function declineConfirmationRequest(
  employeeId: string,
  requestId: string,
  note: string | null
): Promise<ScheduleConfirmationRequest> {
  const data = await apiClient<ScheduleConfirmationRequestRaw>(
    'POST',
    API_URLS.employeeConfirmationRequestDecline(employeeId, requestId),
    { body: { note } }
  )
  return normalizeRequest(data)
}
