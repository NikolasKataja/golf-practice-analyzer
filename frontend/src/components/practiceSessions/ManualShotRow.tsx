import ShotFields from "./ShotFields";
import type { ManualShotDraft } from "./ShotFields";

type Props = {
  shot: ManualShotDraft;
  number: number;
  canRemove: boolean;
  onChange: (shot: ManualShotDraft) => void;
  onRemove: () => void;
};

export default function ManualShotRow({
  shot,
  number,
  canRemove,
  onChange,
  onRemove,
}: Props) {
  return (
    <section
      className="practice-entry__shot-group"
      aria-labelledby={`shot-${shot.id}-heading`}
    >
      <div className="practice-entry__shot-header">
        <h3 id={`shot-${shot.id}-heading`}>Shot {number}</h3>
        <button
          className="practice-entry__remove-shot"
          type="button"
          disabled={!canRemove}
          aria-label={`Remove shot ${number}`}
          onClick={onRemove}
        >
          Remove
        </button>
      </div>
      <ShotFields shot={shot} onChange={onChange} />
    </section>
  );
}
