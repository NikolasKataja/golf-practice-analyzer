import type { PracticeSessionShot } from "../../api/practiceSessions";
import cardStyles from "./PracticeSessionList.module.css";
import styles from "./ShotDirection.module.css";
import { TARGET_ZONE_HALF_WIDTH_METERS } from "./targetZone";

type Props = {
  shots: PracticeSessionShot[];
};

export default function ShotDirection({ shots }: Props) {
  const counts = shots.reduce(
    (result, shot) => {
      if (shot.carrySide < -TARGET_ZONE_HALF_WIDTH_METERS) result.left += 1;
      else if (shot.carrySide > TARGET_ZONE_HALF_WIDTH_METERS) result.right += 1;
      else result.within += 1;
      return result;
    },
    { left: 0, within: 0, right: 0 },
  );
  const directions = [
    { label: "Left of target zone", count: counts.left, key: "left" },
    {
      label: `Within ${TARGET_ZONE_HALF_WIDTH_METERS} m of target line`,
      count: counts.within,
      key: "within",
    },
    { label: "Right of target zone", count: counts.right, key: "right" },
  ];

  return (
    <section className={cardStyles.card} aria-labelledby="target-zone-heading">
      <div className={cardStyles.header}>
        <h2 id="target-zone-heading">Target zone</h2>
      </div>
      {shots.length === 0 ? (
        <p className={cardStyles.message}>No shots to analyze.</p>
      ) : (
        <div className={styles.content}>
          <dl className={styles.counts}>
            {directions.map((direction) => (
              <div className={styles.row} key={direction.key}>
                <dt>{direction.label}</dt>
                <dd>{direction.count}</dd>
              </div>
            ))}
          </dl>
          <p className={styles.summary}>
            {counts.within} of {shots.length} shots finished within{" "}
            {TARGET_ZONE_HALF_WIDTH_METERS} m of the target line.
          </p>
        </div>
      )}
    </section>
  );
}
