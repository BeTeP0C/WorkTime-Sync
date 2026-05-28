import { EmployeeMetric } from '@/entities/employee/model/types'

/** Максимально допустимый период без обновления графика (дни). См. ТЗ §6: D = 90. */
export const ACTUALITY_PERIOD_DAYS = 90

/**
 * Веса компонентов в формуле общего риска неактуальности Ri.
 * См. ТЗ §10: Ri = w1·(1-Ai) + w2·Ci + w3·Li + w4·Zi + w5·Hi
 * Сумма весов = 1.
 */
export const RISK_WEIGHTS = {
  actuality: 0.35,
  conflicts: 0.25,
  load: 0.2,
  timezone: 0.1,
  hr: 0.1,
} as const

export type RiskComponentKey = keyof typeof RISK_WEIGHTS

export interface RiskComponent {
  key: RiskComponentKey
  label: string
  /** Численный вклад в Ri (после умножения на вес). */
  contribution: number
  /** Человекочитаемая подсказка с числами из метрики. */
  hint: string
}

const COMPONENT_LABELS: Record<RiskComponentKey, string> = {
  actuality: 'Актуальность графика',
  conflicts: 'Встречи вне рабочего времени',
  load: 'Загрузка',
  timezone: 'Часовой пояс',
  hr: 'Расхождение с HR',
}

/** Считает разложение Ri по 5 компонентам формулы из ТЗ. */
export function breakdownRi(metric: EmployeeMetric): RiskComponent[] {
  const components: RiskComponent[] = [
    {
      key: 'actuality',
      label: COMPONENT_LABELS.actuality,
      contribution: RISK_WEIGHTS.actuality * (1 - metric.actualityScore),
      hint: `${metric.daysSinceUpdate} дн. без обновления (Ai = ${metric.actualityScore.toFixed(2)})`,
    },
    {
      key: 'conflicts',
      label: COMPONENT_LABELS.conflicts,
      contribution: RISK_WEIGHTS.conflicts * clamp01(metric.conflictRate),
      hint: `${formatPercent(metric.conflictRate)} встреч вне графика (${metric.outsideEventsCount}/${metric.totalEventsCount})`,
    },
    {
      key: 'load',
      label: COMPONENT_LABELS.load,
      contribution: RISK_WEIGHTS.load * clamp01(metric.loadLevel),
      hint: `Li = ${formatPercent(metric.loadLevel)}${metric.loadLevel > 0.8 ? ' — выше нормы' : ''}`,
    },
    {
      key: 'timezone',
      label: COMPONENT_LABELS.timezone,
      contribution: RISK_WEIGHTS.timezone * clamp01(metric.zoneFactor),
      hint:
        metric.zoneFactor > 0
          ? `Активность смещена относительно заявленного ТЗ (Zi = ${metric.zoneFactor.toFixed(2)})`
          : 'Часовой пояс соответствует активности',
    },
    {
      key: 'hr',
      label: COMPONENT_LABELS.hr,
      contribution: RISK_WEIGHTS.hr * clamp01(metric.hrFactor),
      hint:
        metric.hrFactor > 0
          ? `Календарь расходится с HR-данными (Hi = ${metric.hrFactor.toFixed(2)})`
          : 'HR-данные и календарь согласованы',
    },
  ]
  return components.sort((a, b) => b.contribution - a.contribution)
}

/**
 * Прогноз Ai после подтверждения графика сегодня:
 * по ТЗ §6 Ai = 1 - daysSinceUpdate / D. Если подтвердить сегодня, days = 0 → Ai = 1.0.
 */
export function forecastAiAfterUpdate(): number {
  return 1.0
}

/** Прогноз общего Ri после подтверждения графика. Ai-компонента обнуляется. */
export function forecastRiAfterUpdate(metric: EmployeeMetric): number {
  const remaining = breakdownRi(metric)
    .filter((c) => c.key !== 'actuality')
    .reduce((acc, c) => acc + c.contribution, 0)
  return clamp01(remaining)
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

function formatPercent(value: number): string {
  return `${Math.round(clamp01(value) * 100)}%`
}
