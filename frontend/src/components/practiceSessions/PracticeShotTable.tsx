import type { PracticeSessionShot } from "../../api/practiceSessions";
import styles from "./PracticeSessionList.module.css";

type PracticeShotTableProps = {
  shots: PracticeSessionShot[];
};

export default function PracticeShotTable({ shots }: PracticeShotTableProps) {
  return (
    <section className={styles.card} aria-labelledby="practice-shots-heading">
      <div className={styles.header}>
        <h2 id="practice-shots-heading">Shots ({shots.length})</h2>
      </div>

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
              </tr>
            </thead>
            <tbody>
              {shots.map((shot) => (
                <tr key={shot.id}>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}