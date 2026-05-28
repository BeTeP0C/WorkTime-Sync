import { format, formatDistanceToNowStrict, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

const EMPTY_DASH = '—'

export function formatScore(score: number | null | undefined, digits = 2): string {
  if (typeof score !== 'number' || !Number.isFinite(score)) return EMPTY_DASH
  return score.toFixed(digits)
}

export function formatPercent(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return EMPTY_DASH
  return `${Math.round(value * 100)}%`
}

function safeFormat(iso: string, pattern: string): string {
  try {
    const dt = parseISO(iso)
    if (Number.isNaN(dt.getTime())) return EMPTY_DASH
    return format(dt, pattern, { locale: ru })
  } catch {
    return EMPTY_DASH
  }
}

export function formatDateShort(iso: string): string {
  return safeFormat(iso, 'd MMM yyyy')
}

export function formatDateMonth(iso: string): string {
  return safeFormat(iso, 'd MMMM yyyy')
}

export function formatDateRange(startIso: string, endIso: string): string {
  try {
    const start = parseISO(startIso)
    const end = parseISO(endIso)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return EMPTY_DASH
    const sameMonth =
      start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
    if (sameMonth) {
      return `${format(start, 'd', { locale: ru })} — ${format(end, 'd MMMM yyyy', { locale: ru })}`
    }
    return `${format(start, 'd MMM', { locale: ru })} — ${format(end, 'd MMM yyyy', { locale: ru })}`
  } catch {
    return EMPTY_DASH
  }
}

export function formatRelativeUpdated(iso: string): string {
  try {
    const dt = parseISO(iso)
    if (Number.isNaN(dt.getTime())) return EMPTY_DASH
    return `Обновлено ${formatDistanceToNowStrict(dt, { locale: ru, addSuffix: false })} назад`
  } catch {
    return EMPTY_DASH
  }
}

/** Русская плюрализация */
export function pluralizeRu(count: number, forms: [string, string, string]): string {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1]
  return forms[2]
}

export const DAYS_FORMS: [string, string, string] = ['день', 'дня', 'дней']
export const PEOPLE_FORMS: [string, string, string] = ['человек', 'человека', 'человек']
export const PARTICIPANTS_FORMS: [string, string, string] = ['участник', 'участника', 'участников']
export const MEETINGS_FORMS: [string, string, string] = ['встреча', 'встречи', 'встреч']
export const CONFLICTS_FORMS: [string, string, string] = ['конфликт', 'конфликта', 'конфликтов']
