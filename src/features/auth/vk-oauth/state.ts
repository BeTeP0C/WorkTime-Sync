const VK_STATE_STORAGE_KEY = 'auth.vk.state'

export function generateState(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function storeState(state: string): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(VK_STATE_STORAGE_KEY, state)
}

export function consumeState(): string | null {
  if (typeof window === 'undefined') return null
  const value = window.sessionStorage.getItem(VK_STATE_STORAGE_KEY)
  if (value !== null) {
    window.sessionStorage.removeItem(VK_STATE_STORAGE_KEY)
  }
  return value
}

export function appendStateToUrl(url: string, state: string): string {
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}state=${encodeURIComponent(state)}`
}
