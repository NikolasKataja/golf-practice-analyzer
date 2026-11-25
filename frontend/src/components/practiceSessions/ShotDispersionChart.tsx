import type { PracticeSessionShot } from "../../api/practiceSessions";
import styles from "./ShotDispersionChart.module.css";
import { TARGET_ZONE_HALF_WIDTH_METERS } from "./targetZone";

const plot = { left: 60, right: 796, top: 16, bottom: 170 };

function niceStep(rawStep: number) {
  const power = 10 ** Math.floor(Math.log10(rawStep));
  const fraction = rawStep / power;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * power;
}

function formatTick(value: number) {
  return String(Number(value.toPrecision(4)));
}

type Props = {
  shots: PracticeSessionShot[];
  clubs: string[];
  selectedClub: string;
};

export default function ShotDispersionChart({
  shots,
  clubs,
  selectedClub,
}: Props) {
  const colors = new Map(
    clubs.map((club, index) => [
      club,
      `hsl(${Math.round((index * 137.508) % 360)} 58% 38%)`,
    ]),
  );
  const visibleShots = shots;

  const maxSide = Math.max(
    TARGET_ZONE_HALF_WIDTH_METERS,
    ...visibleShots.map((shot) => Math.abs(shot.carrySide)),
  );
  const xStep = niceStep((maxSide * 1.1) / 4);
  const xBound = Math.ceil((maxSide * 1.1) / xStep) * xStep;
  const xTicks = Array.from(
    { length: Math.round((xBound * 2) / xStep) + 1 },
    (_, index) => -xBound + index * xStep,
  );

  const carries = visibleShots.map((shot) => shot.carry);
  let yMin = carries.length ? Math.min(...carries) : 0;
  let yMax = carries.length ? Math.max(...carries) : 1;
  if (yMin === yMax) {
    const pad = Math.max(Math.abs(yMin) * 0.1, 1);
    yMin -= pad;
    yMax += pad;
  }
  const yRange = yMax - yMin;
  const yStep = niceStep((yRange * 1.2) / 5);
  yMin = Math.floor((yMin - yRange * 0.1) / yStep) * yStep;
  yMax = Math.ceil((yMax + yRange * 0.1) / yStep) * yStep;
  const yTicks = Array.from(
    { length: Math.round((yMax - yMin) / yStep) + 1 },
    (_, index) => yMin + index * yStep,
  );

  const xPosition = (value: number) =>
    plot.left + ((value + xBound) / (xBound * 2)) * (plot.right - plot.left);
  const yPosition = (value: number) =>
    plot.bottom - ((value - yMin) / (yMax - yMin)) * (plot.bottom - plot.top);

  return (
    <section className={styles.card} aria-labelledby="shot-dispersion-heading">
      <div className={styles.header}>
        <h2 id="shot-dispersion-heading">Shot dispersion</h2>
      </div>

      {visibleShots.length === 0 ? (
        <p className={styles.message}>This practice session has no shots.</p>
      ) : (
        <>
          <div className={styles.chartContainer}>
            <svg
              className={styles.chart}
              viewBox="0 0 820 220"
              role="img"
              aria-label={`Shot dispersion for ${selectedClub || "all clubs"}`}
            >
              <rect
                className={styles.targetZone}
                x={xPosition(-TARGET_ZONE_HALF_WIDTH_METERS)}
                y={plot.top}
                width={
                  xPosition(TARGET_ZONE_HALF_WIDTH_METERS) -
                  xPosition(-TARGET_ZONE_HALF_WIDTH_METERS)
                }
                height={plot.bottom - plot.top}
              />
              {xTicks.map((tick) => (
                <g key={`x-${tick}`}>
                  <line
                    className={tick === 0 ? styles.targetLine : styles.grid}
                    x1={xPosition(tick)}
                    x2={xPosition(tick)}
                    y1={plot.top}
                    y2={plot.bottom}
                  />
                  <text
                    className={styles.tick}
                    x={xPosition(tick)}
                    y={plot.bottom + 20}
                    textAnchor="middle"
                  >
                    {formatTick(tick)}
                  </text>
                </g>
              ))}
              {yTicks.map((tick) => (
                <g key={`y-${tick}`}>
                  <line
                    className={styles.grid}
                    x1={plot.left}
                    x2={plot.right}
                    y1={yPosition(tick)}
                    y2={yPosition(tick)}
                  />
                  <text
                    className={styles.tick}
                    x={plot.left - 10}
                    y={yPosition(tick) + 4}
                    textAnchor="end"
                  >
                    {formatTick(tick)}
                  </text>
                </g>
              ))}
              <line
                className={styles.axis}
                x1={plot.left}
                x2={plot.right}
                y1={plot.bottom}
                y2={plot.bottom}
              />
              <line
                className={styles.axis}
                x1={plot.left}
                x2={plot.left}
                y1={plot.top}
                y2={plot.bottom}
              />
              {visibleShots.map((shot) => (
                <circle
                  key={shot.id}
                  cx={xPosition(shot.carrySide)}
                  cy={yPosition(shot.carry)}
                  r="5"
                  fill={colors.get(shot.club)}
                  className={styles.point}
                >
                  <title>
                    {shot.club} · Carry: {shot.carry} m ·{" "}
                    {shot.carrySide === 0
                      ? "0 m on target line"
                      : `${Math.abs(shot.carrySide)} m ${
                          shot.carrySide < 0 ? "left" : "right"
                        }`}
                  </title>
                </circle>
              ))}
              <text
                className={styles.axisLabel}
                x={(plot.left + plot.right) / 2}
                y={plot.bottom + 40}
                textAnchor="middle"
              >
                Side deviation (m)
              </text>
              <text
                className={styles.axisLabel}
                transform={`translate(18 ${(plot.top + plot.bottom) / 2}) rotate(-90)`}
                textAnchor="middle"
              >
                Carry (m)
              </text>
            </svg>
          </div>
          {!selectedClub && (
            <ul className={styles.legend} aria-label="Clubs">
              {clubs.map((club) => (
                <li key={club}>
                  <span
                    className={styles.legendSwatch}
                    style={{ backgroundColor: colors.get(club) }}
                    aria-hidden="true"
                  />
                  {club}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
