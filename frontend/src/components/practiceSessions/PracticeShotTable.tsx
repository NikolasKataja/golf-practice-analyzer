import { createPortal } from "react-dom";
import { Fragment, useLayoutEffect, useRef, useState } from "react";
import {
  deleteShot,
  type PracticeSessionShot,
} from "../../api/practiceSessions";
import styles from "./PracticeSessionList.module.css";
import AddPracticeShotsForm from "./AddPracticeShotsForm";
import EditShotForm from "./EditShotForm";
import SuccessToast from "../SuccessToast";

type ShotActionsProps = {
  sessionId: number;
  shotId: number;
  shotNumber: number;
  disabled: boolean;
  onEdit: () => void;
  onDeleted: (shotId: number) => void;
  onDeletingChange: (shotId: number | null) => void;
};

function ShotActions({
  sessionId,
  shotId,
  shotNumber,
  disabled,
  onEdit,
  onDeleted,
  onDeletingChange,
}: ShotActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null,
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const deleting = useRef(false);
  const panelId = `shot-actions-${shotId}`;

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
        if (!deleting.current) setIsOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (!deleting.current) {
          setIsOpen(false);
          triggerRef.current?.focus();
        }
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
    if (deleting.current) return;

    deleting.current = true;
    setIsDeleting(true);
    setError("");
    onDeletingChange(shotId);

    try {
      await deleteShot(sessionId, shotId);
      onDeleted(shotId);
      setIsOpen(false);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete the shot.",
      );
    } finally {
      deleting.current = false;
      setIsDeleting(false);
      onDeletingChange(null);
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        className={`${styles.actionsTrigger} ${styles.shotActionsTrigger}`}
        type="button"
        disabled={disabled}
        aria-label={`Actions for shot ${shotNumber}`}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => {
          setPosition(null);
          setIsConfirming(false);
          setError("");
          setIsOpen((open) => !open);
        }}
      >
        <span aria-hidden="true">•••</span>
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={panelRef}
            id={panelId}
            className={styles.shotActionsPanel}
            role="group"
            aria-label={`Actions for shot ${shotNumber}`}
            style={{
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              visibility: position ? "visible" : "hidden",
            }}
          >
            {isConfirming ? (
              <div className={styles.deleteConfirmation}>
                <p>Delete shot #{shotNumber}?</p>
                <div className={styles.confirmationActions}>
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
                  <button
                    className={styles.deleteButton}
                    type="button"
                    disabled={isDeleting}
                    onClick={() => void handleDelete()}
                  >
                    {isDeleting ? "Deleting…" : "Delete"}
                  </button>
                </div>
                {error && (
                  <p className={styles.deleteError} role="alert">
                    {error}
                  </p>
                )}
              </div>
            ) : (
              <>
                <button
                  className={styles.shotMenuItem}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setIsOpen(false);
                    onEdit();
                  }}
                >
                  Edit shot
                </button>
                <button
                  className={styles.deleteMenuItem}
                  type="button"
                  disabled={disabled}
                  onClick={() => setIsConfirming(true)}
                >
                  Delete shot
                </button>
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

type PracticeShotTableProps = {
  sessionId: number;
  shots: PracticeSessionShot[];
  onShotSaved: (shot: PracticeSessionShot) => void;
  onShotDeleted: (shotId: number) => void;
  onShotsAdded: (shots: PracticeSessionShot[]) => void;
};

export default function PracticeShotTable({
  sessionId,
  shots,
  onShotSaved,
  onShotDeleted,
  onShotsAdded,
}: PracticeShotTableProps) {
  const [editingShotId, setEditingShotId] = useState<number | null>(null);
  const [isSavingShot, setIsSavingShot] = useState(false);
  const [deletingShotId, setDeletingShotId] = useState<number | null>(null);
  const [isAddingShots, setIsAddingShots] = useState(false);
  const [addedShotCount, setAddedShotCount] = useState<number | null>(null);

  return (
    <section className={styles.card} aria-labelledby="practice-shots-heading">
      <div className={styles.header}>
        <h2 id="practice-shots-heading">Shots ({shots.length})</h2>
        <button
          className="button-secondary"
          type="button"
          disabled={
            isAddingShots || isSavingShot || deletingShotId !== null
          }
          aria-expanded={isAddingShots}
          aria-controls="add-practice-shots-form"
          onClick={() => setIsAddingShots(true)}
        >
          + Add shots
        </button>
      </div>

      {isAddingShots && (
        <div id="add-practice-shots-form">
          <AddPracticeShotsForm
            sessionId={sessionId}
            onCancel={() => setIsAddingShots(false)}
            onSaved={(addedShots) => {
              onShotsAdded(addedShots);
              setAddedShotCount(addedShots.length);
              setIsAddingShots(false);
            }}
          />
        </div>
      )}

      {addedShotCount !== null && (
        <SuccessToast
          title="Shots added"
          message={`${addedShotCount} ${
            addedShotCount === 1 ? "shot" : "shots"
          } added to this practice session.`}
          onDismiss={() => setAddedShotCount(null)}
        />
      )}

      {shots.length === 0 ? (
        <p className={styles.message}>This practice session has no shots.</p>
      ) : (
        <div
          className={styles.tableContainer}
          role="region"
          aria-labelledby="practice-shots-heading"
          tabIndex={0}
        >
          <table className={styles.table} aria-labelledby="practice-shots-heading">
            <thead>
              <tr>
                <th scope="col" className={styles.shots}>Shot #</th>
                <th scope="col">Club</th>
                <th scope="col" className={styles.shots}>Carry (m)</th>
                <th scope="col" className={styles.shots}>Side deviation (m)</th>
                <th scope="col" className={styles.shots}>Ball speed (km/h)</th>
                <th scope="col" className={styles.shots}>Launch angle (°)</th>
                <th scope="col" className={styles.shots}>Peak height (m)</th>
                <th scope="col" className={styles.shots}>Total distance (m)</th>
                <th scope="col">Shot time</th>
                <th scope="col" className={styles.actionsHeading}>
                  <span className={styles.visuallyHidden}>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shots.map((shot) => (
                <Fragment key={shot.id}>
                  <tr>
                    <td className={styles.shots}>{shot.shotNumber}</td>
                    <td>{shot.club}</td>
                    <td className={styles.shots}>{shot.carry}</td>
                    <td className={styles.shots}>{shot.carrySide}</td>
                    <td className={styles.shots}>{shot.ballSpeed ?? "-"}</td>
                    <td className={styles.shots}>{shot.launchAngle ?? "-"}</td>
                    <td className={styles.shots}>{shot.peakHeight ?? "-"}</td>
                    <td className={styles.shots}>{shot.totalDistance ?? "-"}</td>
                    <td className={styles.date}>
                      {shot.shotAt ? (
                        <time dateTime={shot.shotAt}>
                          {new Date(shot.shotAt).toLocaleString()}
                        </time>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className={styles.actionsCell}>
                      <ShotActions
                        sessionId={sessionId}
                        shotId={shot.id}
                        shotNumber={shot.shotNumber}
                        disabled={
                          isSavingShot ||
                          deletingShotId !== null ||
                          editingShotId === shot.id
                        }
                        onEdit={() => setEditingShotId(shot.id)}
                        onDeleted={onShotDeleted}
                        onDeletingChange={setDeletingShotId}
                      />
                    </td>
                  </tr>
                  {editingShotId === shot.id && (
                    <tr key={`${shot.id}-edit`}>
                      <td className={styles.shotEditCell} colSpan={10}>
                        <EditShotForm
                          sessionId={sessionId}
                          shot={shot}
                          onSavingChange={setIsSavingShot}
                          onCancel={() => setEditingShotId(null)}
                          onSaved={(updatedShot) => {
                            onShotSaved(updatedShot);
                            setEditingShotId(null);
                          }}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}