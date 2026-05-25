import { format, formatDistanceToNowStrict, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

export function formatScore(score: number, digits = 2): string {
  return score.toFixed(digits)
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

export function formatDateShort(iso: string): string {
  return format(parseISO(iso), 'd MMM yyyy', { locale: ru })
}

export function formatDateMonth(iso: string): string {
  return format(parseISO(iso), 'd MMMM yyyy', { locale: ru })
}

export function formatDateRange(startIso: string, endIso: string): string {
  const start = parseISO(startIso)
  const end = parseISO(endIso)
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
  if (sameMonth) {
    return `${format(start, 'd', { locale: ru })} — ${format(end, 'd MMMM yyyy', { locale: ru })}`
  }
  return `${format(start, 'd MMM', { locale: ru })} — ${format(end, 'd MMM yyyy', { locale: ru })}`
}

export function formatRelativeUpdated(iso: string): string {
  return `Обновлено ${formatDistanceToNowStrict(parseISO(iso), { locale: ru, addSuffix: false })} назад`
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
