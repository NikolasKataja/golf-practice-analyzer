import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { updatePracticeSession } from '../../api/practiceSessions'
import type { UpdatePracticeSessionRequest } from '../../api/practiceSessions'
import styles from './PracticeSessionList.module.css'

type Props = {
  sessionId: number
  initialName: string
  initialDate: string
  startInEditMode?: boolean
  onCancel?: () => void
  onSavingChange?: (isSaving: boolean) => void
  onSaved: (details: UpdatePracticeSessionRequest) => void
}

export default function EditPracticeSessionForm({
  sessionId,
  initialName,
  initialDate,
  onCancel,
  onSavingChange,
  onSaved,
}: Props) {
  const [name, setName] = useState(initialName)
  const [practiceDate, setPracticeDate] = useState(initialDate)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const saving = useRef(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (saving.current) return

    if (!name.trim()) {
      setError('Enter a session name.')
      return
    }

    saving.current = true
    setIsSaving(true)
    onSavingChange?.(true)
    setError('')

    const details = {
      name: name.trim(),
      practiceDate,
    }

    try {
      await updatePracticeSession(sessionId, details)
      onSaved(details)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not update practice details.',
      )
    } finally {
      saving.current = false
      setIsSaving(false)
      onSavingChange?.(false)
    }
  }

  return (
    <section
      id="edit-practice-details"
      className={styles.card}
      aria-labelledby="edit-practice-details-heading"
    >
      <div className={styles.header}>
        <h2 id="edit-practice-details-heading">Edit details</h2>
      </div>

      <form className="practice-session-page__edit-form" onSubmit={handleSubmit}>
        <fieldset
          className="practice-session-page__edit-fields"
          disabled={isSaving}
        >
          <legend className="practice-session-page__edit-legend">
            Practice details
          </legend>

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

          <div className="practice-session-page__edit-actions">
            <button className="button-secondary" type="button" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit">Save changes</button>
          </div>
        </fieldset>

        {isSaving && <p role="status">Saving changes…</p>}
        {error && <p role="alert">{error}</p>}
      </form>
    </section>
  )
}
