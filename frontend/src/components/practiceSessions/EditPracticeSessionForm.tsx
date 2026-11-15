import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { updatePracticeSession } from '../../api/practiceSessions'
import type { UpdatePracticeSessionRequest } from '../../api/practiceSessions'

type Props = {
  sessionId: number
  initialName: string
  initialDate: string
  onSaved: (details: UpdatePracticeSessionRequest) => void
}

export default function EditPracticeSessionForm({
  sessionId,
  initialName,
  initialDate,
  onSaved,
}: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [practiceDate, setPracticeDate] = useState(initialDate)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const saving = useRef(false)

  function startEditing() {
    // Start each edit with the currently displayed practice details.
    setName(initialName)
    setPracticeDate(initialDate)
    setError('')
    setMessage('')
    setIsEditing(true)
  }

  function cancelEditing() {
    setError('')
    setIsEditing(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (saving.current) return

    if (!name.trim()) {
      setError('Enter a session name.')
      return
    }

    saving.current = true
    setIsSaving(true)
    setError('')

    const details = {
      name: name.trim(),
      practiceDate,
    }

    try {
      await updatePracticeSession(sessionId, details)

      // Update the parent page only after the server confirms the save.
      onSaved(details)
      setIsEditing(false)
      setMessage('Practice details updated.')
    } catch (err) {
      // Keep the form open and preserve the entered values.
      setError(
        err instanceof Error ? err.message : 'Could not update practice details.',
      )
    } finally {
      saving.current = false
      setIsSaving(false)
    }
  }

  return (
    <section aria-label="Edit practice details">
      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <fieldset disabled={isSaving}>
            <legend>Edit practice details</legend>

            <p>
              <label htmlFor="edit-session-name">Session name</label>
              <input
                id="edit-session-name"
                required
                maxLength={150}
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
              />
            </p>

            <p>
              <label htmlFor="edit-session-date">Practice date</label>
              <input
                id="edit-session-date"
                type="date"
                required
                value={practiceDate}
                onChange={(event) => setPracticeDate(event.currentTarget.value)}
              />
            </p>

            <button type="submit">Save changes</button>
            <button type="button" onClick={cancelEditing}>
              Cancel
            </button>
          </fieldset>

          {isSaving && <p role="status">Saving changes…</p>}
          {error && <p role="alert">{error}</p>}
        </form>
      ) : (
        <button type="button" onClick={startEditing}>
          Edit practice details
        </button>
      )}

      {message && <p role="status">{message}</p>}
    </section>
  )
}