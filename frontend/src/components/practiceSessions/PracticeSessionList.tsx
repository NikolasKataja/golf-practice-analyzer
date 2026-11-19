import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { createPortal } from "react-dom";
import { getPracticeSessions } from "../../api/practiceSessions";
import {
  deletePracticeSession,
  type PracticeSessionSummary,
} from "../../api/practiceSessions";
import styles from "./PracticeSessionList.module.css";

type SessionActionsProps = {
  session: PracticeSessionSummary;
  onDeleted: (sessionId: number) => void;
};

function SessionActions({ session, onDeleted }: SessionActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null,
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = `practice-session-actions-${session.id}`;

  useLayoutEffect(() => {
    if (!isOpen) return;

    function updatePosition() {
      const trigger = triggerRef.current;
      const panel = panelRef.current;
      if (!trigger || !panel) return;

      const triggerRect = trigger.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const edge = 8;
      const left = Math.max(
        edge,
        Math.min(
          triggerRect.right - panelRect.width,
          window.innerWidth - panelRect.width - edge,
        ),
      );
      const below = triggerRect.bottom + edge;
      const top =
        below + panelRect.height <= window.innerHeight - edge
          ? below
          : Math.max(edge, triggerRect.top - panelRect.height - edge);

      setPosition({ top, left });
    }

    function closeOnOutsideClick(event: PointerEvent) {
      const target = event.target;
      if (
        target instanceof Node &&
        !triggerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        if (!isDeleting) setIsOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    updatePosition();
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, isConfirming, isDeleting, error]);

  async function handleDelete() {
    setIsDeleting(true);
    setError("");

    try {
      await deletePracticeSession(session.id);
      onDeleted(session.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not delete the practice session.",
      );
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        className={styles.actionsTrigger}
        type="button"
        aria-label={`Actions for ${session.name}`}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
          } else {
            setIsConfirming(false);
            setError("");
            setPosition(null);
            setIsOpen(true);
          }
        }}
      >
        <span aria-hidden="true">•••</span>
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={panelRef}
            id={panelId}
            className={styles.actionsPanel}
            role="group"
            aria-label={`Actions for ${session.name}`}
            style={{
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              visibility: position ? "visible" : "hidden",
            }}
          >
            {isConfirming ? (
              <div className={styles.deleteConfirmation}>
                <p>
                  Delete “{session.name}” and all {session.shotCount} shots?
                  This cannot be undone.
                </p>
                <div className={styles.confirmationActions}>
                  <button
                    className={styles.deleteButton}
                    type="button"
                    disabled={isDeleting}
                    onClick={() => void handleDelete()}
                  >
                    {isDeleting ? "Deleting…" : "Delete"}
                  </button>
                  <button
                    className={styles.cancelButton}
                    type="button"
                    disabled={isDeleting}
                    onClick={() => {
                      setIsConfirming(false);
                      setError("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
                {error && <p className={styles.deleteError} role="alert">{error}</p>}
              </div>
            ) : (
              <ul className={styles.actionsList}>
                <li>
                  <Link
                    to={`/practice-sessions/${session.id}?edit=true`}
                    onClick={() => setIsOpen(false)}
                  >
                    Edit session
                  </Link>
                </li>
                <li>
                  <button
                    className={styles.deleteMenuItem}
                    type="button"
                    onClick={() => setIsConfirming(true)}
                  >
                    Delete session
                  </button>
                </li>
              </ul>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

export default function PracticeSessionList() {
  const [sessions, setSessions] = useState<PracticeSessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSessions() {
      setIsLoading(true);
      setError("");

      try {
        const data = await getPracticeSessions(controller.signal);

        if (!controller.signal.aborted) {
          setSessions(data);
        }
      } catch (err) {
        // Leaving the page cancels the request without showing an error.
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load practice sessions.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadSessions();

    // Cancel the request when the component unmounts or the effect restarts.
    return () => controller.abort();
  }, [refreshKey]);

  return (
    <section
      className={styles.card}
      aria-labelledby="practice-sessions-heading"
    >
      <div className={styles.header}>
        <h2 id="practice-sessions-heading">Your practice sessions</h2>

        <button
          className={styles.refreshButton}
          type="button"
          disabled={isLoading}
          onClick={() => setRefreshKey((current) => current + 1)}
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <p className={styles.message} role="status">
          Loading practice sessions…
        </p>
      ) : error ? (
        <p className={`${styles.message} ${styles.error}`} role="alert">
          {error}
        </p>
      ) : sessions.length === 0 ? (
        <p className={styles.message}>
          No practice sessions yet. Import a CSV file to get started.
        </p>
      ) : (
        <div className={styles.tableContainer}>
          <table
            className={styles.table}
            aria-labelledby="practice-sessions-heading"
          >
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Practice date</th>
                <th scope="col" className={styles.shots}>
                  Shots
                </th>
                <th scope="col" className={styles.actionsHeading}>
                  <span className={styles.visuallyHidden}>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td>
                    <Link
                      className={styles.sessionLink}
                      to={`/practice-sessions/${session.id}`}
                    >
                      {session.name}
                    </Link>
                  </td>
                  <td className={styles.date}>
                    <time dateTime={session.practiceDate}>
                      {session.practiceDate}
                    </time>
                  </td>
                  <td className={styles.shots}>{session.shotCount}</td>
                  <td className={styles.actionsCell}>
                    <SessionActions
                      session={session}
                      onDeleted={(sessionId) =>
                        setSessions((current) =>
                          current.filter((item) => item.id !== sessionId),
                        )
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
