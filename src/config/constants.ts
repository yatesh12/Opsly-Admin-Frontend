export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8001'

export const STORAGE_KEYS = {
  TOKEN: 'admin_token',
  USER: 'admin_user',
} as const
