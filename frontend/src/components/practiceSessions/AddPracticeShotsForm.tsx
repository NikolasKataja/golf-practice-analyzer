import { useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  addPracticeSessionShots,
  type CreateShotRequest,
  type PracticeSessionShot,
} from "../../api/practiceSessions";
import ManualShotRow from "./ManualShotRow";
import type { ManualShotDraft } from "./ShotFields";
import styles from "./PracticeSessionList.module.css";

type Props = {
  sessionId: number;
  onCancel: () => void;
  onSaved: (shots: PracticeSessionShot[]) => void;
};

function emptyShot(id: number, club = ""): ManualShotDraft {
  return {
    id,
    club,
    carry: "",
    direction: "",
    sideDistance: "",
    ballSpeed: "",
    launchAngle: "",
    peakHeight: "",
    totalDistance: "",
  };
}

function optionalNumber(value: string): number | null {
  return value.trim() === "" ? null : Number(value);
}

function toShotRequest(shot: ManualShotDraft): CreateShotRequest {
  return {
    club: shot.club,
    carry: Number(shot.carry),
    carrySide:
      shot.direction === "centre"
        ? 0
        : Number(shot.sideDistance) * (shot.direction === "left" ? -1 : 1),
    ballSpeed: optionalNumber(shot.ballSpeed),
    launchAngle: optionalNumber(shot.launchAngle),
    peakHeight: optionalNumber(shot.peakHeight),
    totalDistance: optionalNumber(shot.totalDistance),
  };
}

export default function AddPracticeShotsForm({
  sessionId,
  onCancel,
  onSaved,
}: Props) {
  const [shots, setShots] = useState<ManualShotDraft[]>([emptyShot(-1)]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const nextId = useRef(-2);
  const saving = useRef(false);

  function addShot() {
    const id = nextId.current--;
    setShots((current) => [
      ...current,
      emptyShot(id, current[current.length - 1]?.club ?? ""),
    ]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;

    saving.current = true;
    setIsSaving(true);
    setError("");

    try {
      const addedShots = await addPracticeSessionShots(
        sessionId,
        shots.map(toShotRequest),
      );
      onSaved(addedShots);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not add shots.",
      );
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  }

  return (
    <form
      className={`${styles.addShotsForm} practice-entry__form`}
      onSubmit={handleSubmit}
    >
      <fieldset
        className="practice-entry__fieldset"
        disabled={isSaving}
      >
        <legend className="practice-entry__visually-hidden">Add shots</legend>
        <div className="practice-entry__shots">
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

        <div className={styles.editShotActions}>
          <button
            className="button-secondary"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button type="submit">Save shots</button>
        </div>
      </fieldset>

      {isSaving && <p role="status">Saving shots…</p>}
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
