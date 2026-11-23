import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import ShotFields from './ShotFields'
import type { ManualShotDraft } from './ShotFields'
import { updateShot } from '../../api/practiceSessions'
import type { PracticeSessionShot } from '../../api/practiceSessions'
import styles from './PracticeSessionList.module.css'

type Props = {
  sessionId: number
  shot: PracticeSessionShot
  onSaved: (shot: PracticeSessionShot) => void
  onCancel: () => void
  onSavingChange?: (isSaving: boolean) => void
}

function createDraft(shot: PracticeSessionShot): ManualShotDraft {
  return {
    id: shot.id,
    club: shot.club,
    carry: String(shot.carry),
    direction:
      shot.carrySide === 0
        ? 'centre'
        : shot.carrySide < 0
          ? 'left'
          : 'right',
    sideDistance:
      shot.carrySide === 0 ? '' : String(Math.abs(shot.carrySide)),
    // Preserve missing measurements as empty fields.
    ballSpeed: shot.ballSpeed === null ? '' : String(shot.ballSpeed),
    launchAngle: shot.launchAngle === null ? '' : String(shot.launchAngle),
    peakHeight: shot.peakHeight === null ? '' : String(shot.peakHeight),
    totalDistance:
      shot.totalDistance === null ? '' : String(shot.totalDistance),
  }
}

function optionalNumber(value: string): number | null {
  return value.trim() === '' ? null : Number(value)
}

export default function EditShotForm({
  sessionId,
  shot,
  onSaved,
  onCancel,
  onSavingChange,
}: Props) {
  const [draft, setDraft] = useState(() => createDraft(shot))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const saving = useRef(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (saving.current) return

    saving.current = true
    setIsSaving(true)
    onSavingChange?.(true)
    setError('')

    try {
      const updated = await updateShot(sessionId, shot.id, {
        club: draft.club,
        carry: Number(draft.carry),
        carrySide:
          draft.direction === 'centre'
            ? 0
            : Number(draft.sideDistance)
              * (draft.direction === 'left' ? -1 : 1),
        ballSpeed: optionalNumber(draft.ballSpeed),
        launchAngle: optionalNumber(draft.launchAngle),
        peakHeight: optionalNumber(draft.peakHeight),
        totalDistance: optionalNumber(draft.totalDistance),
      })

      // Use the server response to update the displayed shot.
      onSaved(updated)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not update the shot.',
      )
    } finally {
      saving.current = false
      setIsSaving(false)
      onSavingChange?.(false)
    }
  }

  return (
    <form className={styles.editShotForm} onSubmit={handleSubmit}>
      <fieldset disabled={isSaving}>
        <legend>Edit shot {shot.shotNumber}</legend>

        <div className="practice-entry__shots">
          <ShotFields shot={draft} onChange={setDraft} />
        </div>

        <div className={styles.editShotActions}>
          <button className={styles.cancelButton} type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit">Save changes</button>
        </div>
      </fieldset>

      {isSaving && <p role="status">Saving shot…</p>}
      {error && <p role="alert">{error}</p>}
    </form>
  )
}