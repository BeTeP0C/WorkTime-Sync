export const API_URLS = {
  dashboardSummary: () => '/dashboard/summary',

  employees: () => '/employees',
  employee: (id: string) => `/employees/${id}`,
  employeeScheduleActive: (id: string) => `/employees/${id}/schedules/active`,
  employeeExceptions: (id: string) => `/employees/${id}/exceptions`,
  employeeEvents: (id: string) => `/employees/${id}/events`,
  employeeRecommendations: (id: string) => `/employees/${id}/recommendations`,

  teams: () => '/teams',
  team: (id: string) => `/teams/${id}`,
  teamMembers: (id: string) => `/teams/${id}/members`,
  teamAvailability: (id: string) => `/teams/${id}/availability`,
  teamMeetingRecommendations: (id: string) => `/teams/${id}/meeting-recommendations`,
  teamRecommendations: (id: string) => `/teams/${id}/recommendations`,

  recommendations: () => '/recommendations',
} as const

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'
