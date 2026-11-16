import { useRef, useState } from 'react'
import { deleteShot } from '../../api/practiceSessions'

type Props = {
  sessionId: number
  shotId: number
  shotNumber: number
  disabled: boolean
  onDeleted: () => void
}

export default function DeleteShotButton({
  sessionId,
  shotId,
  shotNumber,
  disabled,
  onDeleted,
}: Props) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const deleting = useRef(false)

  async function handleDelete() {
    if (deleting.current || disabled) return

    deleting.current = true
    setIsDeleting(true)
    setError('')

    try {
      await deleteShot(sessionId, shotId)

      // Remove the row only after the server confirms deletion.
      onDeleted()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not delete the shot.',
      )
    } finally {
      deleting.current = false
      setIsDeleting(false)
    }
  }

  return (
    <div>
      {isConfirming ? (
        <>
          <p>
            Delete shot {shotNumber}? This cannot be undone.
          </p>

          <button
            type="button"
            disabled={disabled || isDeleting}
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
          disabled={disabled}
          aria-label={`Delete shot ${shotNumber}`}
          onClick={() => setIsConfirming(true)}
        >
          Delete shot
        </button>
      )}

      {isDeleting && <p role="status">Deleting shot…</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  )
}