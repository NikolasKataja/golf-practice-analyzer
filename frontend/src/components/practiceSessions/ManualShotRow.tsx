// Keep input values as strings so empty fields do not become zero.
export type ManualShotDraft = {
  id: number;
  club: string;
  carry: string;
  direction: "" | "left" | "centre" | "right";
  sideDistance: string;
  ballSpeed: string;
  launchAngle: string;
  peakHeight: string;
  totalDistance: string;
};

const clubs = [
  "Driver",
  "3 Wood",
  "5 Wood",
  "7 Wood",
  "3 Hybrid",
  "4 Hybrid",
  "5 Hybrid",
  "2 Iron",
  "3 Iron",
  "4 Iron",
  "5 Iron",
  "6 Iron",
  "7 Iron",
  "8 Iron",
  "9 Iron",
  "Pitching Wedge",
  "Gap Wedge",
  "Sand Wedge",
  "Lob Wedge",
];

const additionalFields = [
  { name: "ballSpeed", label: "Ball speed (km/h)", min: 0 },
  { name: "launchAngle", label: "Launch angle (°)", min: -9999999.999 },
  { name: "peakHeight", label: "Peak height (m)", min: 0 },
  { name: "totalDistance", label: "Total distance (m)", min: 0 },
] as const;

type Props = {
  shot: ManualShotDraft;
  number: number;
  canRemove: boolean;
  hideRemove?: boolean;
  separateMetrics?: boolean;
  onChange: (shot: ManualShotDraft) => void;
  onRemove: () => void;
};

export default function ManualShotRow({
  shot,
  number,
  canRemove,
  onChange,
  onRemove,
  hideRemove = false,
  separateMetrics = false,
}: Props) {
  const prefix = `shot-${shot.id}`;

  function renderAdditionalFields() {
    return additionalFields.map((field) => (
      <p key={field.name}>
        <label htmlFor={`${prefix}-${field.name}`}>{field.label}</label>
        <input
          id={`${prefix}-${field.name}`}
          type="number"
          min={field.min}
          max="9999999.999"
          step="0.001"
          value={shot[field.name]}
          onChange={(event) =>
            onChange({
              ...shot,
              [field.name]: event.currentTarget.value,
            })
          }
        />
      </p>
    ));
  }

  if (separateMetrics) {
    return (
      <section
        className="practice-entry__shot-group"
        aria-labelledby={`${prefix}-heading`}
      >
        <div className="practice-entry__shot-header">
          <h3 id={`${prefix}-heading`}>Shot {number}</h3>
          {!hideRemove && (
            <button
              className="practice-entry__remove-shot"
              type="button"
              disabled={!canRemove}
              aria-label={`Remove shot ${number}`}
              onClick={onRemove}
            >
              Remove
            </button>
          )}
        </div>

        <div className="practice-entry__shot-fields">
          <p>
            <label htmlFor={`${prefix}-club`}>Club</label>
            <select
              id={`${prefix}-club`}
              value={shot.club}
              required
              onChange={(event) =>
                onChange({ ...shot, club: event.currentTarget.value })
              }
            >
              <option value="">Choose a club</option>
              {clubs.map((club) => (
                <option key={club} value={club}>
                  {club}
                </option>
              ))}
            </select>
          </p>

          <p>
            <label htmlFor={`${prefix}-carry`}>Carry (m)</label>
            <input
              id={`${prefix}-carry`}
              type="number"
              min="0.001"
              max="9999999.999"
              step="0.001"
              required
              value={shot.carry}
              onChange={(event) =>
                onChange({ ...shot, carry: event.currentTarget.value })
              }
            />
          </p>

          <p>
            <label htmlFor={`${prefix}-direction`}>Side at landing</label>
            <select
              id={`${prefix}-direction`}
              required
              value={shot.direction}
              onChange={(event) => {
                const direction = event.currentTarget
                  .value as ManualShotDraft["direction"];

                onChange({
                  ...shot,
                  direction,
                  // Clear an old distance when the target line is selected.
                  sideDistance: direction === "centre" ? "" : shot.sideDistance,
                });
              }}
            >
              <option value="">Choose a direction</option>
              <option value="left">Left</option>
              <option value="centre">On target line</option>
              <option value="right">Right</option>
            </select>
          </p>

          <p>
            <label htmlFor={`${prefix}-side`}>
              Distance from target line (m)
            </label>
            {shot.direction === "centre" ? (
              <span className="practice-entry__field-hint">On target line</span>
            ) : (
              <input
                id={`${prefix}-side`}
                type="number"
                min="0.001"
                max="9999999.999"
                step="0.001"
                required
                value={shot.sideDistance}
                onChange={(event) =>
                  onChange({ ...shot, sideDistance: event.currentTarget.value })
                }
              />
            )}
          </p>
        </div>

        <details className="practice-entry__additional-metrics">
          <summary>Additional metrics (optional)</summary>
          <div className="practice-entry__metrics-fields">
            {renderAdditionalFields()}
          </div>
        </details>
      </section>
    );
  }

  return (
    <>
      <tr>
        <th scope="row">{number}</th>

        <td data-label="Club">
          <label htmlFor={`${prefix}-club`}>Club</label>
          <select
            id={`${prefix}-club`}
            value={shot.club}
            required
            onChange={(event) =>
              onChange({ ...shot, club: event.currentTarget.value })
            }
          >
            <option value="">Choose a club</option>
            {clubs.map((club) => (
              <option key={club} value={club}>
                {club}
              </option>
            ))}
          </select>
        </td>

        <td data-label="Carry (m)">
          <label htmlFor={`${prefix}-carry`}>Carry (m)</label>
          <input
            id={`${prefix}-carry`}
            type="number"
            min="0.001"
            max="9999999.999"
            step="0.001"
            required
            value={shot.carry}
            onChange={(event) =>
              onChange({ ...shot, carry: event.currentTarget.value })
            }
          />
        </td>

        <td data-label="Side at landing">
          <label htmlFor={`${prefix}-direction`}>Side at landing</label>
          <select
            id={`${prefix}-direction`}
            required
            value={shot.direction}
            onChange={(event) => {
              const direction = event.currentTarget
                .value as ManualShotDraft["direction"];

              onChange({
                ...shot,
                direction,
                // Clear an old distance when the target line is selected.
                sideDistance: direction === "centre" ? "" : shot.sideDistance,
              });
            }}
          >
            <option value="">Choose a direction</option>
            <option value="left">Left</option>
            <option value="centre">On target line</option>
            <option value="right">Right</option>
          </select>
          {shot.direction !== "centre" && (
            <>
              <label htmlFor={`${prefix}-side`}>
                Distance from target line (m)
              </label>
              <input
                id={`${prefix}-side`}
                type="number"
                min="0.001"
                max="9999999.999"
                step="0.001"
                required
                value={shot.sideDistance}
                onChange={(event) =>
                  onChange({ ...shot, sideDistance: event.currentTarget.value })
                }
              />
            </>
          )}
        </td>

        <td data-label="Additional metrics">
          <details>
            <summary>Additional metrics (optional)</summary>
            {renderAdditionalFields()}
          </details>
        </td>

        <td data-label="Actions">
          {!hideRemove && (
            <button type="button" disabled={!canRemove} onClick={onRemove}>
              Remove
            </button>
          )}
        </td>
      </tr>
    </>
  );
}
