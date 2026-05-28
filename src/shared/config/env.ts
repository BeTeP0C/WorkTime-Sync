/** Для браузера — относительный путь, чтобы Next rewrites делал same-origin
 *  прокси на бэк и httpOnly cookie работали без cross-site проблем. */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1'

/** Для SSR (Node) — абсолютный URL: rewrites не сработают, нужно ходить напрямую. */
export const SERVER_API_BASE = process.env.SERVER_API_URL ?? 'http://localhost:8000/api/v1'
