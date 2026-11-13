import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import ManualShotRow from '../components/practiceSessions/ManualShotRow'
import type { ManualShotDraft } from '../components/practiceSessions/ManualShotRow'
import { createPracticeSession } from '../api/practiceSessions'
import type { PracticeSessionSummary } from '../api/practiceSessions'

function emptyShot(id: number, club = ''): ManualShotDraft {
  return {
    id,
    club,
    carry: '',
    direction: '',
    sideDistance: '',
    ballSpeed: '',
    launchAngle: '',
    peakHeight: '',
    totalDistance: '',
  }
}

function optionalNumber(value: string): number | null {
  return value.trim() === '' ? null : Number(value)
}

export default function CreatePracticeSessionPage() {
  const [name, setName] = useState('')
  const [practiceDate, setPracticeDate] = useState('')
  const [shots, setShots] = useState<ManualShotDraft[]>([emptyShot(1)])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState<PracticeSessionSummary | null>(null)
  const nextId = useRef(2)
  const saving = useRef(false)

  function addShot() {
    const id = nextId.current++

    // Carry over only the club; each shot needs its own measurements.
    setShots((current) => [
      ...current,
      emptyShot(id, current[current.length - 1]?.club ?? ''),
    ])
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // Prevent duplicate requests, including rapid repeated submissions.
    if (saving.current) return

    if (!name.trim()) {
      setError('Enter a session name.')
      return
    }

    saving.current = true
    setIsSaving(true)
    setError('')

    try {
      const result = await createPracticeSession({
        name: name.trim(),
        practiceDate,
        shots: shots.map((shot) => ({
          club: shot.club,
          carry: Number(shot.carry),
          // Convert the user-friendly direction into the shared signed value.
          carrySide:
            shot.direction === 'centre'
              ? 0
              : Number(shot.sideDistance)
                * (shot.direction === 'left' ? -1 : 1),
          ballSpeed: optionalNumber(shot.ballSpeed),
          launchAngle: optionalNumber(shot.launchAngle),
          peakHeight: optionalNumber(shot.peakHeight),
          totalDistance: optionalNumber(shot.totalDistance),
        })),
      })

      setSaved(result)
    } catch (err) {
      // Keep the entered data so the user can correct or retry the request.
      setError(
        err instanceof Error ? err.message : 'Could not save the practice session.',
      )
    } finally {
      saving.current = false
      setIsSaving(false)
    }
  }

  return (
    <main>
      <Link to="/dashboard">Back to dashboard</Link>
      <h1>Add practice session manually</h1>

      {saved ? (
        <p role="status">
          Saved “{saved.name}” with {saved.shotCount} shots.
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <fieldset disabled={isSaving}>
            <legend>Practice details</legend>

            <p>
              <label htmlFor="manual-name">Session name</label>
              <input
                id="manual-name"
                required
                maxLength={150}
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
              />
            </p>

            <p>
              <label htmlFor="manual-date">Practice date</label>
              <input
                id="manual-date"
                type="date"
                required
                value={practiceDate}
                onChange={(event) => setPracticeDate(event.currentTarget.value)}
              />
            </p>

            <h2>Shots</h2>
            <p>
              Choose a club and enter the carry distance and side at landing
              for each shot. These fields are required.
            </p>
            <p>
              Carry is the distance to where the ball first lands.
              Side distance shows how far left or right of the target line
              it lands.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table>
                <caption>Shot results — distances in metres</caption>
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
                  {shots.map((shot, index) => (
                    <ManualShotRow
                      key={shot.id}
                      shot={shot}
                      number={index + 1}
                      canRemove={shots.length > 1}
                      onChange={(updated) =>
                        setShots((current) =>
                          current.map((item) =>
                            item.id === updated.id ? updated : item,
                          ),
                        )
                      }
                      onRemove={() =>
                        setShots((current) =>
                          current.filter((item) => item.id !== shot.id),
                        )
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <p>
              <button type="button" onClick={addShot}>Add shot</button>
            </p>
            <p>
              <button type="submit">Save practice session</button>
            </p>
          </fieldset>

          {isSaving && <p role="status">Saving session…</p>}
          {error && <p role="alert">{error}</p>}
        </form>
      )}
    </main>
  )
}