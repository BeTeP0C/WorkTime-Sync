import { SelectOption } from '@/shared/ui/Select'

import { WorkFormat } from './types'

export const TIMEZONE_OPTIONS: SelectOption<string>[] = [
  { value: 'Europe/Kaliningrad', label: 'UTC+2 Калининград' },
  { value: 'Europe/Moscow', label: 'UTC+3 Москва' },
  { value: 'Europe/Samara', label: 'UTC+4 Самара' },
  { value: 'Asia/Yekaterinburg', label: 'UTC+5 Екатеринбург' },
  { value: 'Asia/Omsk', label: 'UTC+6 Омск' },
  { value: 'Asia/Krasnoyarsk', label: 'UTC+7 Красноярск' },
  { value: 'Asia/Novosibirsk', label: 'UTC+7 Новосибирск' },
  { value: 'Asia/Irkutsk', label: 'UTC+8 Иркутск' },
  { value: 'Asia/Yakutsk', label: 'UTC+9 Якутск' },
  { value: 'Asia/Vladivostok', label: 'UTC+10 Владивосток' },
  { value: 'Asia/Magadan', label: 'UTC+11 Магадан' },
  { value: 'Asia/Kamchatka', label: 'UTC+12 Камчатка' },
  { value: 'Europe/Berlin', label: 'UTC+1 Берлин' },
  { value: 'Europe/Istanbul', label: 'UTC+3 Стамбул' },
  { value: 'Europe/London', label: 'UTC+0 Лондон' },
  { value: 'UTC', label: 'UTC' },
]

export const WORK_FORMAT_OPTIONS: SelectOption<WorkFormat>[] = [
  { value: 'office', label: 'Офис' },
  { value: 'remote', label: 'Удалёнка' },
  { value: 'hybrid', label: 'Гибрид' },
]

export const WORK_FORMAT_LABEL_RU: Record<WorkFormat, string> = {
  office: 'Офис',
  remote: 'Удалёнка',
  hybrid: 'Гибрид',
}

export function getTimezoneLabel(value: string): string {
  return TIMEZONE_OPTIONS.find((o) => o.value === value)?.label ?? value
}
