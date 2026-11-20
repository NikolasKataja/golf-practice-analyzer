import { useEffect, useState } from "react";
import {
  getPracticeSession,
  getPracticeSessions,
  type PracticeSessionDetails,
  type PracticeSessionSummary,
} from "../api/practiceSessions";
import PracticeSessionList from "../components/practiceSessions/PracticeSessionList";
import ShotDispersionChart from "../components/practiceSessions/ShotDispersionChart";
import AddPracticeSessionMenu from "../components/practiceSessions/AddPracticeSessionMenu";
import AppHeader from "../components/layout/AppHeader";
import "./DashboardPage.css";

type DetailsState =
  | { sessionId: number; status: "error"; message: string }
  | { sessionId: number; status: "ready"; session: PracticeSessionDetails };

type SessionListResult = {
  refreshKey: number;
  sessions: PracticeSessionSummary[];
  error: string;
};

function newestSession(sessions: PracticeSessionSummary[]) {
  return sessions.reduce<PracticeSessionSummary | null>((newest, session) => {
    if (
      !newest ||
      session.practiceDate > newest.practiceDate ||
      (session.practiceDate === newest.practiceDate && session.id > newest.id)
    ) {
      return session;
    }

    return newest;
  }, null);
}

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [sessionListResult, setSessionListResult] =
    useState<SessionListResult | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null,
  );
  const [details, setDetails] = useState<DetailsState | null>(null);
  const isLoadingSessions =
    sessionListResult === null || sessionListResult.refreshKey !== refreshKey;
  const sessions = isLoadingSessions ? [] : sessionListResult.sessions;
  const sessionsError = isLoadingSessions ? "" : sessionListResult.error;

  useEffect(() => {
    const controller = new AbortController();

    async function loadSessions() {
      try {
        const data = await getPracticeSessions(controller.signal);
        if (controller.signal.aborted) return;

        setSessionListResult({ refreshKey, sessions: data, error: "" });
        setSelectedSessionId((current) =>
          current !== null && data.some((session) => session.id === current)
            ? current
            : newestSession(data)?.id ?? null,
        );
      } catch (error) {
        if (!controller.signal.aborted) {
          setSessionListResult({
            refreshKey,
            sessions: [],
            error:
              error instanceof Error
                ? error.message
                : "Could not load practice sessions.",
          });
        }
      }
    }

    void loadSessions();
    return () => controller.abort();
  }, [refreshKey]);

  useEffect(() => {
    if (selectedSessionId === null) {
      return;
    }

    const sessionId = selectedSessionId;
    const controller = new AbortController();

    async function loadDetails() {
      try {
        const session = await getPracticeSession(sessionId, controller.signal);
        if (!controller.signal.aborted) {
          setDetails({ sessionId, status: "ready", session });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setDetails({
            sessionId,
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Could not load the practice session.",
          });
        }
      }
    }

    void loadDetails();
    return () => controller.abort();
  }, [selectedSessionId]);

  function handleSessionDeleted(sessionId: number) {
    const remaining = sessions.filter((session) => session.id !== sessionId);
    setSessionListResult({ refreshKey, sessions: remaining, error: "" });
    setSelectedSessionId((selected) =>
      selected === sessionId
        ? newestSession(remaining)?.id ?? null
        : selected,
    );
  }

  const selectedSession = sessions.find(
    (session) => session.id === selectedSessionId,
  );
  const selectedDetails =
    details?.sessionId === selectedSessionId ? details : null;

  return (
    <>
      <AppHeader />

      <main className="dashboard">
        <div className="dashboard__intro">
          <div>
            <h1>Practice overview</h1>
            <p>Browse your practice sessions and review your shots.</p>
          </div>

          <AddPracticeSessionMenu />
        </div>

        <section className="dashboard__analysis" aria-label="Practice analysis">
          {isLoadingSessions ? (
            <p className="dashboard__message" role="status">
              Loading practice sessions…
            </p>
          ) : sessionsError ? (
            <p className="dashboard__message dashboard__error" role="alert">
              {sessionsError}
            </p>
          ) : sessions.length === 0 ? (
            <p className="dashboard__message">
              Add a practice session to see shot analysis.
            </p>
          ) : (
            <>
              <label className="dashboard__session-select">
                <span>Practice session</span>
                <select
                  value={selectedSessionId ?? ""}
                  onChange={(event) =>
                    setSelectedSessionId(Number(event.currentTarget.value))
                  }
                >
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.name}
                    </option>
                  ))}
                </select>
              </label>

              {!selectedSession || !selectedDetails ? (
                <p className="dashboard__message" role="status">
                  Loading practice session…
                </p>
              ) : selectedDetails.status === "error" ? (
                <p className="dashboard__message dashboard__error" role="alert">
                  {selectedDetails.message}
                </p>
              ) : (
                <ShotDispersionChart
                  key={selectedSession.id}
                  shots={selectedDetails.session.shots}
                />
              )}
            </>
          )}
        </section>

        <div className="dashboard__sessions">
          <PracticeSessionList
            sessions={sessions}
            isLoading={isLoadingSessions}
            error={sessionsError}
            onRefresh={() => setRefreshKey((current) => current + 1)}
            onDeleted={handleSessionDeleted}
          />
        </div>
      </main>
    </>
  );
}