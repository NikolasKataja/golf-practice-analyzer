import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import {
  getPracticeSession,
  type PracticeSessionDetails,
  type PracticeSessionShot,
} from "../api/practiceSessions";
import EditPracticeSessionForm from "../components/practiceSessions/EditPracticeSessionForm";
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
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const isEditing = searchParams.get("edit") === "true";

  function setEditMode(open: boolean) {
    const nextSearchParams = new URLSearchParams(searchParams);
    if (open) {
      nextSearchParams.set("edit", "true");
    } else {
      nextSearchParams.delete("edit");
    }

    setSearchParams(nextSearchParams, { replace: !open });
  }

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
    <div className="practice-session-page__details">
      <header className="practice-session-page__intro">
        <div>
          <h1>{session.name}</h1>
          <p className="practice-session-page__date">
            <time dateTime={session.practiceDate}>{session.practiceDate}</time>
          </p>
        </div>
        <button
          className="button-secondary practice-session-page__edit-toggle"
          type="button"
          disabled={isSavingDetails}
          aria-expanded={isEditing}
          aria-controls={isEditing ? "edit-practice-details" : undefined}
          onClick={() => setEditMode(!isEditing)}
        >
          Edit details
        </button>
      </header>

      {isEditing && (
        <EditPracticeSessionForm
          sessionId={session.id}
          initialName={session.name}
          initialDate={session.practiceDate}
          onSavingChange={setIsSavingDetails}
          onCancel={() => setEditMode(false)}
          onSaved={(details) => {
            setState((current) =>
              current.status === "ready"
                ? { ...current, session: { ...current.session, ...details } }
                : current,
            );
            setEditMode(false);
          }}
        />
      )}

      <PracticeShotTable
        sessionId={session.id}
        shots={session.shots}
        onShotSaved={(updatedShot: PracticeSessionShot) =>
          setState((current) =>
            current.status === "ready"
              ? {
                  ...current,
                  session: {
                    ...current.session,
                    shots: current.session.shots.map((shot) =>
                      shot.id === updatedShot.id ? updatedShot : shot,
                    ),
                  },
                }
              : current,
          )
        }
        onShotDeleted={(deletedShotId) =>
          setState((current) =>
            current.status === "ready"
              ? {
                  ...current,
                  session: {
                    ...current.session,
                    shots: current.session.shots.filter(
                      (shot) => shot.id !== deletedShotId,
                    ),
                  },
                }
              : current,
          )
        }
      />
    </div>
  );
}