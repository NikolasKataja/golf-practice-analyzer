import { useState } from 'react'
import { useNavigate } from 'react-router' 
import { useAuth } from '../hooks/useAuth'
import DeleteAccountForm from '../components/auth/DeleteAccountForm'

export default function AccountPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleLogout() {
    setError('')
    setIsSubmitting(true)

    try {
      await logout()

      // ProtectedRoute redirects to login after the user becomes null
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Sign-out failed.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main>
      <h1>Your account</h1>
      <p>Signed in as {user?.email}</p>

      <button disabled={isSubmitting} onClick={handleLogout}>
        {isSubmitting ? 'Signing out...' : 'Sign out'}
      </button>

      {error && <p role="alert">{error}</p>}

      <button onClick={() => void navigate('/dashboard')}>
        Go to Dashboard
      </button>

      <DeleteAccountForm disabled={isSubmitting} />
    </main>
  )
}