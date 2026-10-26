import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../hooks/useAuth'

type DeleteAccountFormProps = {
  disabled?: boolean
}

export default function DeleteAccountForm({
  disabled = false,
}: DeleteAccountFormProps) {
  const { deleteAccount } = useAuth()
  const navigate = useNavigate()

  const [isOpen, setIsOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  function handleCancel() {
    // Clear sensitive input and confirmation when closing the form
    setPassword('')
    setIsConfirmed(false)
    setError('')
    setIsOpen(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isConfirmed || isSubmitting || disabled) return

    setError('')
    setIsSubmitting(true)

    try {
      // The backend verifies the password and deletes the signed-in user
      await deleteAccount(password)

      // The existing LoginPage displays this navigation message
      navigate('/login', {
        replace: true,
        state: {
          message: 'Your account and its data have been deleted.',
        },
      })
    } catch (error) {
      setPassword('')
      setError(
        error instanceof Error
          ? error.message
          : 'Account deletion failed.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section aria-labelledby="delete-account-heading">
      <h2 id="delete-account-heading">Delete account</h2>

      {!isOpen ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(true)}
        >
          Delete my account
        </button>
      ) : (
        <form onSubmit={handleSubmit}>
          <p id="delete-account-warning">
            This permanently deletes your account and all your practice
            sessions and shots. This action cannot be undone.
          </p>

          <fieldset disabled={isSubmitting || disabled}>
            <legend>Confirm account deletion</legend>

            <p>
              <label htmlFor="delete-password">Current password</label>
              <input
                id="delete-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </p>

            <p>
              <label>
                <input
                  type="checkbox"
                  required
                  checked={isConfirmed}
                  aria-describedby="delete-account-warning"
                  onChange={(event) =>
                    setIsConfirmed(event.target.checked)
                  }
                />
                I understand that my account and all its data will be
                permanently deleted.
              </label>
            </p>

            <button type="submit" disabled={!isConfirmed}>
              {isSubmitting
                ? 'Deleting account...'
                : 'Permanently delete account'}
            </button>

            <button type="button" onClick={handleCancel}>
              Cancel
            </button>
          </fieldset>

          {error && <p role="alert">{error}</p>}
        </form>
      )}
    </section>
  )
}