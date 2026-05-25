export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true'

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'

export const MOCK_DELAY_MS = Number(process.env.NEXT_PUBLIC_MOCK_DELAY ?? 300)
