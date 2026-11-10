import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import { importCsv, previewCsv } from '../api/practiceSessions'
import type {
  CsvPreview,
  ImportedPracticeSession,
} from '../api/practiceSessions'

function formatSide(metres: number) {
  if (metres === 0) return 'On target line'
  return `${Math.abs(metres)} m ${metres < 0 ? 'left' : 'right'}`
}

export default function ImportPracticeSessionPage() {
  const [name, setName] = useState('')
  const [practiceDate, setPracticeDate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CsvPreview | null>(null)
  const [saved, setSaved] = useState<ImportedPracticeSession | null>(null)
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
      setSaved(await importCsv(file, name.trim(), practiceDate))
      setPreview(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the session.')
    } finally {
      setPending(null)
    }
  }

  return (
    <main>
      <Link to="/dashboard">Back to dashboard</Link>
      <h1>Import practice session</h1>

      {saved ? (
        <p role="status">
          Saved “{saved.name}” with {saved.shotCount} shots.
        </p>
      ) : (
        <>
          <p>Choose a CSV file exported from SwingSync.</p>

          <form onSubmit={handleSave}>
            <fieldset disabled={pending !== null}>
              <legend>Practice details</legend>

              <p>
                <label htmlFor="practice-name">Session name</label><br />
                <input
                  id="practice-name"
                  value={name}
                  maxLength={150}
                  required
                  onChange={(event) => setName(event.currentTarget.value)}
                />
              </p>

              <p>
                <label htmlFor="practice-date">Practice date</label><br />
                <input
                  id="practice-date"
                  type="date"
                  value={practiceDate}
                  required
                  onChange={(event) => setPracticeDate(event.currentTarget.value)}
                />
              </p>

              <p>
                <label htmlFor="practice-file">SwingSync CSV file</label><br />
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
              </p>

              <button type="button" disabled={!file} onClick={handlePreview}>
                Preview file
              </button>

              {preview && (
                <section aria-labelledby="preview-heading">
                  <h2 id="preview-heading">Preview</h2>
                  <p role="status">
                    {preview.shotCount} shots · {preview.clubs.join(', ')}
                  </p>
                  <table>
                    <caption>First {Math.min(5, preview.shots.length)} shots</caption>
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
                </section>
              )}

              <p>
                <button type="submit" disabled={!preview || !name.trim() || !practiceDate}>
                  Save practice session
                </button>
              </p>
            </fieldset>
          </form>

          {pending && (
            <p role="status">
              {pending === 'preview' ? 'Reading file…' : 'Saving session…'}
            </p>
          )}
          {error && <p role="alert">{error}</p>}
        </>
      )}
    </main>
  )
}