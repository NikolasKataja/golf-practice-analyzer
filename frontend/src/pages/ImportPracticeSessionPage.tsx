import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { importCsv, previewCsv } from '../api/practiceSessions'
import AppHeader from '../components/layout/AppHeader'
import cardStyles from '../components/practiceSessions/PracticeSessionList.module.css'
import type { CsvPreview } from '../api/practiceSessions'
import './PracticeSessionEntryPages.css'

function formatSide(metres: number) {
  if (metres === 0) return 'On target line'
  return `${Math.abs(metres)} m ${metres < 0 ? 'left' : 'right'}`
}

export default function ImportPracticeSessionPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [practiceDate, setPracticeDate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CsvPreview | null>(null)
  const [pending, setPending] = useState<'preview' | 'save' | null>(null)
  const [error, setError] = useState('')

  async function handlePreview() {
    if (!file || pending) return

    setError('')
    setPreview(null)
    setPending('preview')

    try {
      setPreview(await previewCsv(file))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not preview the file.')
    } finally {
      setPending(null)
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file || !preview || !name.trim() || !practiceDate || pending) return

    setError('')
    setPending('save')

    try {
      // Send the original file so the server can validate it again before saving.
      const session = await importCsv(file, name.trim(), practiceDate)
      navigate('/dashboard', {
        replace: true,
        state: {
          practiceSessionNotice: {
            type: 'imported',
            sessionId: session.id,
            name: session.name,
            shotCount: session.shotCount,
          },
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the session.')
    } finally {
      setPending(null)
    }
  }

  return (
    <>
      <AppHeader />
      <main className="page-content practice-entry">
        <h1>Import practice session</h1>

        <form className="practice-entry__form" onSubmit={handleSave}>
            <fieldset
              className="practice-entry__fieldset"
              disabled={pending !== null}
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
                    <label htmlFor="practice-name">Session name</label>
                    <input
                      id="practice-name"
                      value={name}
                      maxLength={150}
                      required
                      onChange={(event) => setName(event.currentTarget.value)}
                    />
                  </p>
                  <p>
                    <label htmlFor="practice-date">Practice date</label>
                    <input
                      id="practice-date"
                      type="date"
                      value={practiceDate}
                      required
                      onChange={(event) =>
                        setPracticeDate(event.currentTarget.value)
                      }
                    />
                  </p>
                </div>
              </section>

              <section className={cardStyles.card}>
                <div className={cardStyles.header}>
                  <h2>SwingSync CSV</h2>
                </div>
                <div className="practice-entry__card-content">
                  <label htmlFor="practice-file">CSV file</label>
                  <div className="practice-entry__file-controls">
                    <input
                      id="practice-file"
                      type="file"
                      accept=".csv,text/csv"
                      required
                      onChange={(event) => {
                        setFile(event.currentTarget.files?.[0] ?? null)
                        // A different file must pass its own preview before saving.
                        setPreview(null)
                        setError('')
                      }}
                    />
                    <button
                      className="button-secondary"
                      type="button"
                      disabled={!file}
                      onClick={handlePreview}
                    >
                      Preview file
                    </button>
                  </div>

                  {preview && (
                    <section
                      className="practice-entry__preview"
                      aria-labelledby="preview-heading"
                    >
                      <h3 id="preview-heading">Preview</h3>
                      <p role="status">
                        {preview.shotCount} shots · {preview.clubs.join(', ')}
                      </p>
                      <div className="practice-entry__preview-table">
                        <table>
                          <caption>
                            First {Math.min(5, preview.shots.length)} shots
                          </caption>
                          <thead>
                            <tr>
                              <th scope="col">Shot</th>
                              <th scope="col">Club</th>
                              <th scope="col">Carry (m)</th>
                              <th scope="col">Side at landing</th>
                            </tr>
                          </thead>
                          <tbody>
                            {preview.shots.slice(0, 5).map((shot) => (
                              <tr key={shot.shotNumber}>
                                <td>{shot.shotNumber}</td>
                                <td>{shot.club}</td>
                                <td>{shot.carry}</td>
                                <td>{formatSide(shot.carrySide)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}
                </div>
              </section>

              <div className="practice-entry__actions">
                <button
                  type="submit"
                  disabled={!preview || !name.trim() || !practiceDate}
                >
                  Save practice session
                </button>
              </div>
            </fieldset>
        </form>

        {pending && (
          <p role="status">
            {pending === 'preview' ? 'Reading file…' : 'Saving session…'}
          </p>
        )}
        {error && <p role="alert">{error}</p>}
      </main>
    </>
  )
}