/**
 * Цветовая шкала для heatmap.
 * 0 человек — светло-серый; 1 человек — серый;
 * 2+ — синий #3b6fe8 с возрастающей непрозрачностью.
 */
const GRAY_RGB = '217, 217, 217' // #d9d9d9
const BLUE_RGB = '59, 111, 232' // #3b6fe8

export function heatmapCellOpacity(count: number, max: number): number {
  if (max <= 0) return 0.6
  if (count <= 0) return 0.6
  if (count === 1) return 0.8
  const ratio = Math.min(1, count / max)
  if (ratio >= 0.95) return 1
  if (ratio >= 0.75) return 0.8
  if (ratio >= 0.55) return 0.6
  if (ratio >= 0.4) return 0.4
  if (ratio >= 0.3) return 0.3
  return 0.2
}

export function heatmapColor(count: number, max: number): string {
  const opacity = heatmapCellOpacity(count, max)
  const base = count <= 1 ? GRAY_RGB : BLUE_RGB
  return `rgba(${base}, ${opacity})`
}

export function heatmapTextColor(count: number, max: number): string {
  if (count <= 1 || max <= 0) return '#909090'
  return '#ffffff'
}

export function buildHeatmapLegendColors(max: number): string[] {
  const total = Math.max(1, max)
  return Array.from({ length: total + 1 }, (_, count) => heatmapColor(count, total))
}

/** Сохранено для обратной совместимости / превью. */
export const HEATMAP_LEGEND_COLORS = buildHeatmapLegendColors(7)
