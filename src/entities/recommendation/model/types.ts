export type RecommendationCode =
  | 'outdated_schedule'
  | 'high_conflict_rate'
  | 'high_load_level'
  | 'high_risk_score'
  | 'events_outside_schedule'
  | 'timezone_mismatch_suspicion'

export type RecommendationSeverity = 'medium' | 'high' | 'critical'

export type RecommendationSubject = 'employee' | 'team'

export interface RecommendationRaw {
  code: RecommendationCode
  reason: string
  severity: RecommendationSeverity
  action: string
  subject_type: RecommendationSubject
  subject_id: string
}

export interface Recommendation {
  code: RecommendationCode
  reason: string
  severity: RecommendationSeverity
  action: string
  subjectType: RecommendationSubject
  subjectId: string
  title: string
}

export const RECOMMENDATION_TITLE_RU: Record<RecommendationCode, string> = {
  outdated_schedule: 'Подтвердить или обновить рабочий график',
  high_conflict_rate: 'Снизить количество встреч на этой неделе',
  high_load_level: 'Снизить количество встреч на этой неделе',
  high_risk_score: 'Запросить обновление данных у сотрудника',
  events_outside_schedule: 'Перенести встречи за пределы рабочего времени',
  timezone_mismatch_suspicion: 'Проверить часовой пояс — активность смещена',
}

export const SEVERITY_LABEL_RU: Record<RecommendationSeverity, string> = {
  medium: 'Средний',
  high: 'Высокий',
  critical: 'Срочно',
}
