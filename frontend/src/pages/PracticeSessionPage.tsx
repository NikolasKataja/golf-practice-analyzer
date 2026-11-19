import { useEffect, useState } from "react";
import { useParams } from "react-router";
import {
  getPracticeSession,
  type PracticeSessionDetails,
} from "../api/practiceSessions";
import PracticeShotTable from "../components/practiceSessions/PracticeShotTable";
import AppHeader from "../components/layout/AppHeader";
import "./PracticeSessionPage.css";

type SessionState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; session: PracticeSessionDetails };

export default function PracticeSessionPage() {
  const { sessionId } = useParams();
  const id = Number(sessionId);

  return (
    <main className="practice-session-page">
      <AppHeader />

      {Number.isSafeInteger(id) && id > 0 ? (
        <div className="practice-session-page__content">
          <PracticeSessionContent key={id} id={id} />
        </div>
      ) : (
        <div className="practice-session-page__content">
          <p className="practice-session-page__message" role="alert">
            Practice session not found.
          </p>
        </div>
      )}
    </main>
  );
}

function PracticeSessionContent({ id }: { id: number }) {
  const [state, setState] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    async function loadSession() {
      try {
        const session = await getPracticeSession(id, controller.signal);

        if (!controller.signal.aborted) {
          setState({ status: "ready", session });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Could not load the practice session.",
          });
        }
      }
    }

    void loadSession();
    return () => controller.abort();
  }, [id]);

  if (state.status === "loading") {
    return (
      <p className="practice-session-page__message" role="status">
        Loading practice session…
      </p>
    );
  }

  if (state.status === "error") {
    return (
      <p className="practice-session-page__message" role="alert">
        {state.message}
      </p>
    );
  }

  const { session } = state;

  return (
    <>
      <header className="practice-session-page__intro">
        <h1>{session.name}</h1>
        <p className="practice-session-page__date">
          <time dateTime={session.practiceDate}>{session.practiceDate}</time>
        </p>
      </header>

      <PracticeShotTable shots={session.shots} />
    </>
  );
}