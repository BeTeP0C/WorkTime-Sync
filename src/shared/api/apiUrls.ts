export const API_URLS = {
  authLogin: () => '/auth/login',
  authRegister: () => '/auth/register',
  authMe: () => '/auth/me',
  authRefresh: () => '/auth/refresh',
  authLogout: () => '/auth/logout',
  authVkLogin: () => '/auth/vk/login',
  authVkCallback: (code: string) => `/auth/vk/callback?code=${encodeURIComponent(code)}`,

  dashboardSummary: () => '/dashboard/summary',

  analyticsActualityHistory: (months = 6) => `/analytics/actuality-history?months=${months}`,
  analyticsRiskDistributionHistory: (months = 6) =>
    `/analytics/risk-distribution-history?months=${months}`,
  analyticsTeamRating: (limit = 10) => `/analytics/team-rating?limit=${limit}`,
  analyticsSummaryDeltas: (period: 'month' | 'week' = 'month') =>
    `/analytics/summary-deltas?period=${period}`,
  analyticsTeamMetricsHistory: (teamId: string, months = 6) =>
    `/analytics/teams/${teamId}/metrics-history?months=${months}`,

  employees: () => '/employees',
  employeesFull: () => '/employees/full',
  employee: (id: string) => `/employees/${id}`,
  employeeScheduleActive: (id: string) => `/employees/${id}/schedules/active`,
  employeeScheduleConfirm: (id: string) => `/employees/${id}/schedule/confirm`,
  employeeConfirmationRequests: (id: string) => `/employees/${id}/schedule/confirmation-requests`,
  employeeConfirmationRequestDecline: (id: string, requestId: string) =>
    `/employees/${id}/schedule/confirmation-requests/${requestId}/decline`,
  employeesConfirmationRequestsBulk: () => '/employees/schedule/confirmation-requests/bulk',
  employeeExceptions: (id: string) => `/employees/${id}/exceptions`,
  employeeException: (id: string, excId: string) => `/employees/${id}/exceptions/${excId}`,
  employeeSchedules: (id: string) => `/employees/${id}/schedules`,
  employeeScheduleDiagnostics: (id: string) => `/employees/${id}/schedule-diagnostics`,
  employeeEvents: (id: string) => `/employees/${id}/events`,
  employeeRecommendations: (id: string) => `/employees/${id}/recommendations`,
  employeeHistory: (id: string) => `/employees/${id}/history`,

  teams: () => '/teams',
  team: (id: string) => `/teams/${id}`,
  teamMembers: (id: string) => `/teams/${id}/members`,
  teamMember: (teamId: string, employeeId: string) => `/teams/${teamId}/members/${employeeId}`,
  teamMetrics: (id: string) => `/teams/${id}/metrics`,
  teamAvailability: (id: string) => `/teams/${id}/availability`,
  teamAvailabilityRanking: () => '/teams/availability-ranking',
  teamMeetingRecommendations: (id: string) => `/teams/${id}/meeting-recommendations`,
  teamRecommendations: (id: string) => `/teams/${id}/recommendations`,

  adminRecomputeMetrics: () => '/admin/recompute-metrics',
  adminSeedDemo: () => '/admin/seed-demo',

  recommendations: () => '/recommendations',
  recommendationStatus: (code: string, subjectType: string, subjectId: string) =>
    `/recommendations/${code}/${subjectType}/${subjectId}/status`,
  recommendationsBulkStatus: () => '/recommendations/bulk-status',

  roadmap: () => '/roadmap',
  roadmapItem: (id: string) => `/roadmap/${id}`,
  roadmapItemStatus: (id: string) => `/roadmap/${id}/status`,
  roadmapGenerate: () => '/roadmap/generate',
  roadmapRecompute: () => '/roadmap/recompute',
  teamRoadmap: (id: string) => `/teams/${id}/roadmap`,
  employeeRoadmap: (id: string) => `/employees/${id}/roadmap`,

  notifications: () => '/notifications',
  notificationRead: (id: string) => `/notifications/${id}/read`,

  conflicts: () => '/conflicts',
  conflictAlternatives: (eventId: string) => `/conflicts/${eventId}/alternatives`,
  conflictProposeReschedule: (eventId: string) => `/conflicts/${eventId}/propose-reschedule`,

  importEventsCsv: (source?: string | null) =>
    source ? `/import/events/csv?source=${encodeURIComponent(source)}` : '/import/events/csv',
  importEventsJson: (source?: string | null) =>
    source ? `/import/events/json?source=${encodeURIComponent(source)}` : '/import/events/json',
  eventsManual: () => '/events/manual',

  aiChat: () => '/ai/chat',
  aiChatStream: () => '/ai/chat/stream',
  aiExplainEmployee: (id: string) => `/ai/employees/${id}/explain`,
} as const

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'
