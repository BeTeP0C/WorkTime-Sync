export type ConfirmationStatus = 'pending' | 'confirmed' | 'declined'

export interface ScheduleConfirmationRequestRaw {
  id: string
  employee_id: string
  requested_by_id: string | null
  requested_by_name: string | null
  employee_name: string | null
  reason: string | null
  status: ConfirmationStatus
  created_at: string
  responded_at: string | null
  response_note: string | null
}

export interface ScheduleConfirmationRequest {
  id: string
  employeeId: string
  requestedById: string | null
  requestedByName: string | null
  employeeName: string | null
  reason: string | null
  status: ConfirmationStatus
  createdAt: string
  respondedAt: string | null
  responseNote: string | null
}

export interface ScheduleConfirmResponseRaw {
  confirmed_at: string
  closed_request_ids: string[]
}

export interface ScheduleConfirmResult {
  confirmedAt: string
  closedRequestIds: string[]
}
