import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { authPost, getCurrentUser } from '../api/auth'
import type { AuthUser } from '../api/auth'
import { AuthContext } from './AuthContext'

type AuthProviderProps = {
    children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Restore the session when the application first opens
  useEffect(() => {
    let active = true

    getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser)
      })
      .catch(() => {
        if (active) {
          setError('Could not check your session. Please try again.')
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    // Ignore the result if the provider has already been unmounted
    return () => {
      active = false
    }
  }, [])

  // Allow the UI to retry a failed session check
  const refreshSession = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      setUser(await getCurrentUser())
    } catch {
      setError('Could not check your session. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    // The backend issues the authentication cookie.
    await authPost('login', { email, password })

    // Read the user from the authenticated session.
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      throw new Error('Could not verify the signed-in session.')
    }

    setUser(currentUser)
    setError(null)
  }, [])

  const logout = useCallback(async () => {
    // Clear local state only after the backend confirms logout
    await authPost('logout')
    setUser(null)
    setError(null)
  }, [])

  const deleteAccount = useCallback(async (password: string) => {
    // The backend verifies the password, deletes the account and signs out
    await authPost('delete-account', { password })
    setUser(null)
    setError(null)
  }, [])

  // Request failures from login, logout and deletion propagate to
  // the calling page, where they can be displayed beside the form
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        refreshSession,
        login,
        logout,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}