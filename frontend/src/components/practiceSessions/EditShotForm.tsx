import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import ManualShotRow from './ManualShotRow'
import type { ManualShotDraft } from './ManualShotRow'
import { updateShot } from '../../api/practiceSessions'
import type { PracticeSessionShot } from '../../api/practiceSessions'

type Props = {
  sessionId: number
  shot: PracticeSessionShot
  onSaved: (shot: PracticeSessionShot) => void
  onCancel: () => void
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
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <fieldset disabled={isSaving}>
        <legend>Edit shot {shot.shotNumber}</legend>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <caption>Change the shot measurements before saving</caption>
            <thead>
              <tr>
                <th scope="col">Shot</th>
                <th scope="col">Club</th>
                <th scope="col">Carry</th>
                <th scope="col">Side</th>
                <th scope="col">Optional data</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              <ManualShotRow
                shot={draft}
                number={shot.shotNumber}
                canRemove={false}
                hideRemove
                onChange={setDraft}
                onRemove={() => {}}
              />
            </tbody>
          </table>
        </div>

        <button type="submit">Save shot</button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </fieldset>

      {isSaving && <p role="status">Saving shot…</p>}
      {error && <p role="alert">{error}</p>}
    </form>
  )
}