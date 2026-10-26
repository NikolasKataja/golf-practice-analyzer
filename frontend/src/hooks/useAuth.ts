import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'

export function useAuth() {
  const context = useContext(AuthContext)

  // Catch incorrect usage early instead of returning undefined.
  if (context === undefined) {
    throw new Error('useAuth must be used inside AuthProvider.')
  }

  return context
}