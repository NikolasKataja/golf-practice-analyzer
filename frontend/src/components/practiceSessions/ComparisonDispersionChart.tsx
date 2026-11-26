import type { PracticeSessionShot } from "../../api/practiceSessions";
import { TARGET_ZONE_HALF_WIDTH_METERS } from "./targetZone";

const plot = { left: 60, right: 796, top: 18, bottom: 380 };

function niceStep(rawStep: number) {
  const power = 10 ** Math.floor(Math.log10(rawStep));
  const fraction = rawStep / power;
  return (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10) * power;
}

function formatTick(value: number) {
  return String(Number(value.toPrecision(4)));
}

type Props = {
  sessionAName: string;
  sessionBName: string;
  shotsA: PracticeSessionShot[];
  shotsB: PracticeSessionShot[];
};

export default function ComparisonDispersionChart({
  sessionAName,
  sessionBName,
  shotsA,
  shotsB,
}: Props) {
  const shots = [
    ...shotsA.map((shot) => ({ shot, session: "A" as const })),
    ...shotsB.map((shot) => ({ shot, session: "B" as const })),
  ];
  const xBound = Math.max(
    TARGET_ZONE_HALF_WIDTH_METERS,
    ...shots.map(({ shot }) => Math.abs(shot.carrySide)),
  );
  const xStep = niceStep((xBound * 1.1) / 4);
  const xAxisBound = Math.ceil((xBound * 1.1) / xStep) * xStep;
  const xTicks = Array.from(
    { length: Math.round((xAxisBound * 2) / xStep) + 1 },
    (_, index) => -xAxisBound + index * xStep,
  );

  const carries = shots.map(({ shot }) => shot.carry);
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
    plot.left +
    ((value + xAxisBound) / (xAxisBound * 2)) * (plot.right - plot.left);
  const yPosition = (value: number) =>
    plot.bottom - ((value - yMin) / (yMax - yMin)) * (plot.bottom - plot.top);

  return (
    <section
      className="comparison-dispersion"
      aria-labelledby="comparison-dispersion-heading"
    >
      <h2 id="comparison-dispersion-heading">Combined shot dispersion</h2>
      {shots.length === 0 ? (
        <p className="compare-page__message">
          No shots are available for this club.
        </p>
      ) : (
        <>
          <svg
            className="comparison-dispersion__chart"
            viewBox="0 0 820 450"
            role="img"
            aria-label={`Combined shot dispersion for ${sessionAName} and ${sessionBName}`}
          >
            <rect
              className="comparison-dispersion__zone"
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
                  className={
                    tick === 0
                      ? "comparison-dispersion__target"
                      : "comparison-dispersion__grid"
                  }
                  x1={xPosition(tick)}
                  x2={xPosition(tick)}
                  y1={plot.top}
                  y2={plot.bottom}
                />
                <text
                  className="comparison-dispersion__tick"
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
                  className="comparison-dispersion__grid"
                  x1={plot.left}
                  x2={plot.right}
                  y1={yPosition(tick)}
                  y2={yPosition(tick)}
                />
                <text
                  className="comparison-dispersion__tick"
                  x={plot.left - 10}
                  y={yPosition(tick) + 4}
                  textAnchor="end"
                >
                  {formatTick(tick)}
                </text>
              </g>
            ))}
            <line
              className="comparison-dispersion__axis"
              x1={plot.left}
              x2={plot.right}
              y1={plot.bottom}
              y2={plot.bottom}
            />
            <line
              className="comparison-dispersion__axis"
              x1={plot.left}
              x2={plot.left}
              y1={plot.top}
              y2={plot.bottom}
            />
            {shots.map(({ shot, session }) => (
              <g
                key={`${session}-${shot.id}`}
                transform={`translate(${xPosition(shot.carrySide)} ${yPosition(shot.carry)})`}
              >
                {session === "A" ? (
                  <circle
                    className="comparison-dispersion__point-a"
                    r="5"
                  />
                ) : (
                  <path
                    className="comparison-dispersion__point-b"
                    d="M 0 -6 L 6 0 L 0 6 L -6 0 Z"
                  />
                )}
                <title>
                  Session {session} ({session === "A" ? sessionAName : sessionBName}) ·{" "}
                  {shot.club} · Carry: {shot.carry} m · Side deviation:{" "}
                  {shot.carrySide} m
                </title>
              </g>
            ))}
            <text
              className="comparison-dispersion__label"
              x={(plot.left + plot.right) / 2}
              y={plot.bottom + 40}
              textAnchor="middle"
            >
              Side deviation (m)
            </text>
            <text
              className="comparison-dispersion__label"
              transform={`translate(18 ${(plot.top + plot.bottom) / 2}) rotate(-90)`}
              textAnchor="middle"
            >
              Carry (m)
            </text>
          </svg>
          <ul className="comparison-dispersion__legend">
            <li>
              <span className="comparison-dispersion__swatch-a" />
              {sessionAName}
            </li>
            <li>
              <span className="comparison-dispersion__swatch-b" />
              {sessionBName}
            </li>
          </ul>
        </>
      )}
    </section>
  );
}
