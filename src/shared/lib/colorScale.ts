/**
 * Цветовая шкала для heatmap: индекс ячейки по числу доступных сотрудников.
 * 0 — серый, max — глубокий синий. Цвета синхронизированы с $heatmap-* в colors.scss.
 */
const HEATMAP_COLORS = [
  '#f0f3f8', // 0
  '#c8d6ef', // 1
  '#93b5e5', // 2
  '#5f8cd6', // 3
  '#2563eb', // 4
  '#1d4ed8', // 5
]

export function heatmapColor(count: number, max: number): string {
  if (count <= 0) return HEATMAP_COLORS[0]
  const ratio = Math.min(1, count / Math.max(1, max))
  const idx = Math.max(
    1,
    Math.min(HEATMAP_COLORS.length - 1, Math.ceil(ratio * (HEATMAP_COLORS.length - 1)))
  )
  return HEATMAP_COLORS[idx]
}

export function heatmapTextColor(count: number, max: number): string {
  if (count <= 0) return '#8a93a8'
  const ratio = count / Math.max(1, max)
  return ratio >= 0.6 ? '#ffffff' : '#1a1d29'
}

export const HEATMAP_LEGEND_COLORS = HEATMAP_COLORS
