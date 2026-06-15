import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { api } from '../services/api'
import { STORAGE_KEYS } from '../config/constants'
import type { AdminUser, LoginResponse } from '../types'

interface AuthContextType {
  user: AdminUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.USER)
    return stored ? JSON.parse(stored) : null
  })
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (token) {
      api.get<AdminUser>('/api/v1/admin/auth/me')
        .then((admin) => {
          setUser(admin)
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(admin))
        })
        .catch(() => {
          localStorage.removeItem(STORAGE_KEYS.TOKEN)
          localStorage.removeItem(STORAGE_KEYS.USER)
          setUser(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<LoginResponse>('/api/v1/admin/auth/login', { email, password })
    localStorage.setItem(STORAGE_KEYS.TOKEN, res.access_token)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.admin))
    setUser(res.admin)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
