import type { ShotStatistics } from "../../utils/shotStatistics";
import {
  displayedDifference,
  formatSignedDifference,
} from "../../utils/comparisonFormatting";

type Props = {
  statisticsA: ShotStatistics;
  statisticsB: ShotStatistics;
  targetZonePercentageA: number | null;
  targetZonePercentageB: number | null;
};

export default function ComparisonSummary({
  statisticsA,
  statisticsB,
  targetZonePercentageA,
  targetZonePercentageB,
}: Props) {
  const observations: string[] = [];

  if (
    statisticsA.averageCarry !== null &&
    statisticsB.averageCarry !== null
  ) {
    const difference = displayedDifference(
      statisticsA.averageCarry,
      statisticsB.averageCarry,
    );
    observations.push(
      difference === 0
        ? "Average carry was unchanged."
        : `Average carry changed by ${formatSignedDifference(
            difference,
            "m",
          )} in Session B.`,
    );
  }

  if (
    statisticsA.carryStandardDeviation !== null &&
    statisticsB.carryStandardDeviation !== null
  ) {
    const difference = displayedDifference(
      statisticsA.carryStandardDeviation,
      statisticsB.carryStandardDeviation,
    );
    observations.push(
      difference === 0
        ? "Carry variation was unchanged."
        : `Carry variation changed by ${formatSignedDifference(
            difference,
            "m",
          )}.`,
    );
  }

  if (
    statisticsA.averageAbsoluteDistanceFromTargetLine !== null &&
    statisticsB.averageAbsoluteDistanceFromTargetLine !== null
  ) {
    const difference = displayedDifference(
      statisticsA.averageAbsoluteDistanceFromTargetLine,
      statisticsB.averageAbsoluteDistanceFromTargetLine,
    );
    observations.push(
      difference === 0
        ? "Average distance from the target line was unchanged."
        : `Average distance from the target line changed by ${formatSignedDifference(
            difference,
            "m",
          )}.`,
    );
  }

  if (
    targetZonePercentageA !== null &&
    targetZonePercentageB !== null
  ) {
    const difference = displayedDifference(
      targetZonePercentageA,
      targetZonePercentageB,
    );
    observations.push(
      difference === 0
        ? "The share of shots within the target zone was unchanged."
        : `The share of shots within the target zone changed by ${formatSignedDifference(
            difference,
            "pp",
          )}.`,
    );
  }

  return (
    <section
      className="comparison-summary"
      aria-labelledby="comparison-summary-heading"
    >
      <h2 id="comparison-summary-heading">Comparison summary</h2>
      <p>
        {observations.length
          ? observations.join(" ")
          : "There is not enough shot data to summarize these sessions."}
      </p>
    </section>
  );
}
