import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { authPost } from '../api/auth'
import { useAuth } from '../hooks/useAuth'

export default function RegisterPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Signed-in users already have an account
  if (user) {
    return <Navigate to="/account" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    // Confirm the password locally before sending it to the backend
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)

    try {
      await authPost('register', {
        email: email.trim(),
        password,
      })

      setPassword('')
      setConfirmPassword('')

      // Registration does not create a signed-in session
      // Pass a success message to the login page through router state
      navigate('/login', {
        replace: true,
        state: { message: 'Account created. You can now sign in.' },
      })
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Account creation failed.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main>
      <h1>Create an account</h1>

      <form onSubmit={handleSubmit}>
        <fieldset disabled={isSubmitting}>
          <legend>Account details</legend>

          <p>
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              autoComplete="username"
              maxLength={256}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </p>

          <p>
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              aria-describedby="password-help"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </p>

          <p id="password-help">Use at least 12 characters.</p>

          <p>
            <label htmlFor="confirm-password">Confirm password</label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </p>

          <button type="submit">
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </fieldset>

        {error && <p role="alert">{error}</p>}
      </form>

      <p>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </main>
  )
}