export function exportCsv(filename: string, rows: Array<Record<string, string | number>>): void {
  if (rows.length === 0) return

  const headers = Object.keys(rows[0])
  const escape = (val: string | number): string => {
    const s = String(val)
    if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  const csv = [
    headers.join(';'),
    ...rows.map((row) => headers.map((h) => escape(row[h] ?? '')).join(';')),
  ].join('\n')

  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
