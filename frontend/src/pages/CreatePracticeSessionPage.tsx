import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'
import AppHeader from '../components/layout/AppHeader'
import cardStyles from '../components/practiceSessions/PracticeSessionList.module.css'
import ManualShotRow from '../components/practiceSessions/ManualShotRow'
import type { ManualShotDraft } from '../components/practiceSessions/ShotFields'
import { createPracticeSession } from '../api/practiceSessions'
import './PracticeSessionEntryPages.css'

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
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [practiceDate, setPracticeDate] = useState('')
  const [shots, setShots] = useState<ManualShotDraft[]>([emptyShot(1)])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
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
      const session = await createPracticeSession({
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

      navigate('/dashboard', {
        replace: true,
        state: {
          practiceSessionNotice: {
            type: 'saved',
            sessionId: session.id,
            name: session.name,
            shotCount: session.shotCount,
          },
        },
      })
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
    <>
      <AppHeader />
      <main className="page-content practice-entry">
        <h1>Add practice session manually</h1>

        <form
          className="practice-entry__form"
          onSubmit={handleSubmit}
        >
            <fieldset
              className="practice-entry__fieldset"
              disabled={isSaving}
            >
              <legend className="practice-entry__visually-hidden">
                Practice session
              </legend>

              <section className={cardStyles.card}>
                <div className={cardStyles.header}>
                  <h2>Practice details</h2>
                </div>
                <div className="practice-entry__fields">
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
                      onChange={(event) =>
                        setPracticeDate(event.currentTarget.value)
                      }
                    />
                  </p>
                </div>
              </section>

              <section className={cardStyles.card}>
                <div className={cardStyles.header}>
                  <h2>Shots</h2>
                </div>
                <div className="practice-entry__card-content practice-entry__shots">
                  <p className="practice-entry__shot-help">
                    Carry is the distance to where the ball first lands.
                    Side distance shows how far left or right of the target
                    line it lands.
                  </p>
                  <div className="practice-entry__shot-list">
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
                  </div>
                  <button
                    className="button-secondary practice-entry__add-shot"
                    type="button"
                    onClick={addShot}
                  >
                    Add shot
                  </button>
                </div>
              </section>

              <div className="practice-entry__actions">
                <button type="submit">Save practice session</button>
              </div>
            </fieldset>

            {isSaving && <p role="status">Saving session…</p>}
            {error && <p role="alert">{error}</p>}
        </form>
      </main>
    </>
  )
}