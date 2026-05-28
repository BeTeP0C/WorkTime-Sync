export function extractUtcOffset(label: string): string | null {
  const match = label.match(/UTC[+-]\d+/)
  return match ? match[0] : null
}
