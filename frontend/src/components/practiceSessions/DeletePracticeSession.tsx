import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { deletePracticeSession } from '../../api/practiceSessions'

type Props = {
  sessionId: number
  sessionName: string
  shotCount: number
  onDeleted: () => void
}

export default function DeletePracticeSession({
  sessionId,
  sessionName,
  shotCount,
  onDeleted,
}: Props) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [deleted, setDeleted] = useState(false)
  const deleting = useRef(false)

  async function handleDelete() {
    if (deleting.current) return

    deleting.current = true
    setIsDeleting(true)
    setError('')

    try {
      await deletePracticeSession(sessionId)

      // Hide the deleted data and show confirmation after server success.
      setDeleted(true)
      onDeleted()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not delete the practice session.',
      )
    } finally {
      deleting.current = false
      setIsDeleting(false)
    }
  }

  if (deleted) {
    return (
      <section>
        <p role="status">Practice session deleted.</p>
        <Link to="/dashboard">Back to dashboard</Link>
      </section>
    )
  }

  return (
    <section aria-label="Delete practice session">
      {isConfirming ? (
        <>
          <p>
            Delete “{sessionName}” and all {shotCount} shots?
            This cannot be undone.
          </p>

          <button
            type="button"
            disabled={isDeleting}
            onClick={() => void handleDelete()}
          >
            Delete permanently
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={() => {
              setIsConfirming(false)
              setError('')
            }}
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setIsConfirming(true)}
        >
          Delete practice session
        </button>
      )}

      {isDeleting && <p role="status">Deleting practice session…</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  )
}