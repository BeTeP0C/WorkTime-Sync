import { useEffect } from 'react'

/**
 * Показывает браузерный prompt при попытке закрыть/обновить вкладку, пока
 * `isDirty === true`. Заголовок диалога управляется браузером — кастомный
 * текст игнорируется со времён Chrome 51.
 *
 * Не блокирует in-app навигацию (next/link/router.push) — для этого нужен
 * `useBlocker`/onpopstate, что Next 14 App Router пока не отдаёт публично.
 * Этот хук закрывает самый распространённый сценарий «случайно закрыл вкладку».
 */
export function useUnsavedChangesPrompt(isDirty: boolean): void {
  useEffect(() => {
    if (!isDirty) return
    const handler = (event: BeforeUnloadEvent): void => {
      event.preventDefault()
      // Старые браузеры (FF/Safari) требовали returnValue для срабатывания.
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])
}
