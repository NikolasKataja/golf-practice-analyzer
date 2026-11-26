import type { ShotStatistics } from "../../utils/shotStatistics";
import {
  displayedDifference,
  formatDistance,
  formatPercent,
  formatSignedDifference,
  roundForDisplay,
} from "../../utils/comparisonFormatting";

type Props = {
  sessionAName: string;
  sessionBName: string;
  statisticsA: ShotStatistics;
  statisticsB: ShotStatistics;
  targetZonePercentageA: number | null;
  targetZonePercentageB: number | null;
};

export default function ComparisonTable({
  sessionAName,
  sessionBName,
  statisticsA,
  statisticsB,
  targetZonePercentageA,
  targetZonePercentageB,
}: Props) {
  const rows = [
    {
      label: "Shot count",
      a: statisticsA.shotCount,
      b: statisticsB.shotCount,
      change: statisticsB.shotCount - statisticsA.shotCount,
      format: (value: number | null) =>
        value === null ? "—" : String(value),
      unit: "" as const,
    },
    {
      label: "Average carry",
      a: statisticsA.averageCarry,
      b: statisticsB.averageCarry,
      change: displayedDifference(
        statisticsA.averageCarry,
        statisticsB.averageCarry,
      ),
      format: formatDistance,
      unit: "m" as const,
    },
    {
      label: "Median carry",
      a: statisticsA.medianCarry,
      b: statisticsB.medianCarry,
      change: displayedDifference(
        statisticsA.medianCarry,
        statisticsB.medianCarry,
      ),
      format: formatDistance,
      unit: "m" as const,
    },
    {
      label: "Shortest carry",
      a: statisticsA.minimumCarry,
      b: statisticsB.minimumCarry,
      change: displayedDifference(
        statisticsA.minimumCarry,
        statisticsB.minimumCarry,
      ),
      format: formatDistance,
      unit: "m" as const,
    },
    {
      label: "Longest carry",
      a: statisticsA.maximumCarry,
      b: statisticsB.maximumCarry,
      change: displayedDifference(
        statisticsA.maximumCarry,
        statisticsB.maximumCarry,
      ),
      format: formatDistance,
      unit: "m" as const,
    },
    {
      label: "Carry standard deviation",
      a: statisticsA.carryStandardDeviation,
      b: statisticsB.carryStandardDeviation,
      change: displayedDifference(
        statisticsA.carryStandardDeviation,
        statisticsB.carryStandardDeviation,
      ),
      format: formatDistance,
      unit: "m" as const,
    },
    {
      label: "Average distance from target line",
      a: statisticsA.averageAbsoluteDistanceFromTargetLine,
      b: statisticsB.averageAbsoluteDistanceFromTargetLine,
      change: displayedDifference(
        statisticsA.averageAbsoluteDistanceFromTargetLine,
        statisticsB.averageAbsoluteDistanceFromTargetLine,
      ),
      format: formatDistance,
      unit: "m" as const,
    },
    {
      label: "Side standard deviation",
      a: statisticsA.sideDeviationStandardDeviation,
      b: statisticsB.sideDeviationStandardDeviation,
      change: displayedDifference(
        statisticsA.sideDeviationStandardDeviation,
        statisticsB.sideDeviationStandardDeviation,
      ),
      format: formatDistance,
      unit: "m" as const,
    },
    {
      label: "Shots within target zone (%)",
      a: targetZonePercentageA,
      b: targetZonePercentageB,
      change: displayedDifference(
        targetZonePercentageA,
        targetZonePercentageB,
      ),
      format: formatPercent,
      unit: "pp" as const,
    },
  ];

  return (
    <section
      className="comparison-table"
      aria-labelledby="comparison-table-heading"
    >
      <h2 id="comparison-table-heading">Statistical comparison</h2>
      <div className="comparison-table__scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Metric</th>
              <th scope="col">{sessionAName}</th>
              <th scope="col">{sessionBName}</th>
              <th scope="col">Change (B minus A)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{row.format(roundForDisplay(row.a))}</td>
                <td>{row.format(roundForDisplay(row.b))}</td>
                <td>{formatSignedDifference(row.change, row.unit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
