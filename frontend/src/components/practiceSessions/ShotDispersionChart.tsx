import { useState } from "react";
import type { PracticeSessionShot } from "../../api/practiceSessions";
import styles from "./ShotDispersionChart.module.css";

const plot = { left: 76, right: 780, top: 24, bottom: 350 };

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
};

export default function ShotDispersionChart({ shots }: Props) {
  const [selectedClub, setSelectedClub] = useState("");
  const clubs = [...new Set(shots.map((shot) => shot.club))].sort((a, b) =>
    a.localeCompare(b),
  );
  const colors = new Map(
    clubs.map((club, index) => [
      club,
      `hsl(${Math.round((index * 137.508) % 360)} 58% 38%)`,
    ]),
  );
  const visibleShots = selectedClub
    ? shots.filter((shot) => shot.club === selectedClub)
    : shots;

  const maxSide = Math.max(0, ...visibleShots.map((shot) => Math.abs(shot.carrySide)));
  const xStep = niceStep((maxSide || 1) * 1.1 / 4);
  const xBound = Math.ceil(((maxSide || 1) * 1.1) / xStep) * xStep;
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
        <label className={styles.filter}>
          <span>Club</span>
          <select
            value={selectedClub}
            onChange={(event) => setSelectedClub(event.currentTarget.value)}
            disabled={clubs.length === 0}
          >
            <option value="">All clubs</option>
            {clubs.map((club) => (
              <option key={club} value={club}>
                {club}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visibleShots.length === 0 ? (
        <p className={styles.message}>This practice session has no shots.</p>
      ) : (
        <>
          <div className={styles.chartContainer}>
            <svg
              className={styles.chart}
              viewBox="0 0 820 430"
              role="img"
              aria-label={`Shot dispersion for ${selectedClub || "all clubs"}`}
            >
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
                    {shot.club} · Carry: {shot.carry} m · Side: {shot.carrySide} m
                  </title>
                </circle>
              ))}
              <text
                className={styles.axisLabel}
                x={(plot.left + plot.right) / 2}
                y="418"
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
