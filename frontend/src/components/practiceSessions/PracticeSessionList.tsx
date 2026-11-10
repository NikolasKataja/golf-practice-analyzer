import { useEffect, useState } from 'react'
import { getPracticeSessions } from '../../api/practiceSessions'
import type { PracticeSessionSummary } from '../../api/practiceSessions'

export default function PracticeSessionList() {
  const [sessions, setSessions] = useState<PracticeSessionSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadSessions() {
      setIsLoading(true)
      setError('')

      try {
        const data = await getPracticeSessions(controller.signal)

        if (!controller.signal.aborted) {
          setSessions(data)
        }
      } catch (err) {
        // Leaving the page cancels the request without showing an error.
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load practice sessions.',
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadSessions()

    // Cancel the request when the component unmounts or the effect restarts.
    return () => controller.abort()
  }, [refreshKey])

  return (
    <section aria-labelledby="practice-sessions-heading">
      <h2 id="practice-sessions-heading">Your practice sessions</h2>

      <button
        type="button"
        disabled={isLoading}
        onClick={() => setRefreshKey((current) => current + 1)}
      >
        Refresh sessions
      </button>

      {isLoading ? (
        <p role="status">Loading practice sessions…</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : sessions.length === 0 ? (
        <p>No practice sessions yet. Import a CSV file to get started.</p>
      ) : (
        <table>
          <caption>Practice sessions</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Practice date</th>
              <th scope="col">Shots</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id}>
                <td>{session.name}</td>
                <td>
                  <time dateTime={session.practiceDate}>
                    {session.practiceDate}
                  </time>
                </td>
                <td>{session.shotCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}