import { createContext } from 'react'
import type { AuthUser } from '../api/auth'

export type AuthContextValue = {
    user: AuthUser | null
    isLoading: boolean
    error: string | null
    refreshSession: () => Promise<void>
    login: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
    deleteAccount: (password: string) => Promise<void>
}

// Undefined means the context is being used outside of its provider
export const AuthContext = createContext<AuthContextValue | undefined>(
    undefined,
)