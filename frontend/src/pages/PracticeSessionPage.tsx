import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { getPracticeSession } from "../api/practiceSessions";
import type { PracticeSessionDetails } from "../api/practiceSessions";
import EditPracticeSessionForm from "../components/practiceSessions/EditPracticeSessionForm";
import DeletePracticeSession from "../components/practiceSessions/DeletePracticeSession";

function formatSide(value: number) {
  if (value === 0) return "On target line";
  return `${Math.abs(value)} m ${value < 0 ? "left" : "right"}`;
}

function formatMetric(value: number | null) {
  // A missing measurement must not be displayed as zero.
  return value === null ? "—" : value.toString();
}

export default function PracticeSessionPage() {
  const { id } = useParams();
  const [session, setSession] = useState<PracticeSessionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [isDeleted, setIsDeleted] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSession() {
      setIsDeleted(false);
      setIsLoading(true);
      setError("");
      setSession(null);

      const sessionId = Number(id);

      if (!Number.isSafeInteger(sessionId) || sessionId <= 0) {
        setError("Invalid practice session ID.");
        setIsLoading(false);
        return;
      }

      try {
        const data = await getPracticeSession(sessionId, controller.signal);

        if (!controller.signal.aborted) {
          setSession(data);
        }
      } catch (err) {
        // Ignore requests cancelled when leaving the page.
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load the practice session.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadSession();

    return () => controller.abort();
  }, [id, retryKey]);

  if (isDeleted && session) {
    return (
      <main>
        <h1>Practice session</h1>
        <p role="status">Practice session deleted.</p>
        <Link to="/dashboard">Back to dashboard</Link>
      </main>
    );
  }

  return (
    <main>
      <Link to="/dashboard">Back to dashboard</Link>

      {isLoading ? (
        <p role="status">Loading practice session…</p>
      ) : error ? (
        <>
          <h1>Practice session</h1>
          <p role="alert">{error}</p>
          <button
            type="button"
            onClick={() => setRetryKey((current) => current + 1)}
          >
            Try again
          </button>
        </>
      ) : session ? (
        <>
          <h1>{session.name}</h1>

          <p>
            Practice date:{" "}
            <time dateTime={session.practiceDate}>{session.practiceDate}</time>
          </p>

          <EditPracticeSessionForm
            key={session.id}
            sessionId={session.id}
            initialName={session.name}
            initialDate={session.practiceDate}
            onSaved={(details) =>
              setSession((current) =>
                current ? { ...current, ...details } : current,
              )
            }
          />

          <h2>Shots ({session.shots.length})</h2>

          {session.shots.length === 0 ? (
            <p>This practice session has no shots.</p>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table>
                  <caption>Shot results in shot order</caption>
                  <thead>
                    <tr>
                      <th scope="col">Shot</th>
                      <th scope="col">Club</th>
                      <th scope="col">Carry (m)</th>
                      <th scope="col">Side at landing</th>
                    </tr>
                  </thead>

                  <tbody>
                    {session.shots.map((shot) => (
                      <tr key={shot.id}>
                        <th scope="row">{shot.shotNumber}</th>
                        <td>{shot.club}</td>
                        <td>{shot.carry}</td>
                        <td>{formatSide(shot.carrySide)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <details>
                <summary>Additional metrics</summary>
                <p>— means that the measurement was not provided.</p>

                <div style={{ overflowX: "auto" }}>
                  <table>
                    <caption>Optional measurements by shot</caption>
                    <thead>
                      <tr>
                        <th scope="col">Shot</th>
                        <th scope="col">Club</th>
                        <th scope="col">Ball speed (km/h)</th>
                        <th scope="col">Launch angle (°)</th>
                        <th scope="col">Peak height (m)</th>
                        <th scope="col">Total distance (m)</th>
                      </tr>
                    </thead>

                    <tbody>
                      {session.shots.map((shot) => (
                        <tr key={shot.id}>
                          <th scope="row">{shot.shotNumber}</th>
                          <td>{shot.club}</td>
                          <td>{formatMetric(shot.ballSpeed)}</td>
                          <td>{formatMetric(shot.launchAngle)}</td>
                          <td>{formatMetric(shot.peakHeight)}</td>
                          <td>{formatMetric(shot.totalDistance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </>
          )}
          <DeletePracticeSession
            key={session.id}
            sessionId={session.id}
            sessionName={session.name}
            shotCount={session.shots.length}
            onDeleted={() => setIsDeleted(true)}
          />
        </>
      ) : null}
    </main>
  );
}
