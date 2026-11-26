import type { PracticeSessionShot } from "../api/practiceSessions";

export type ShotStatistics = {
  shotCount: number;
  averageCarry: number | null;
  medianCarry: number | null;
  minimumCarry: number | null;
  maximumCarry: number | null;
  carryStandardDeviation: number | null;
  averageAbsoluteDistanceFromTargetLine: number | null;
  sideDeviationStandardDeviation: number | null;
};

export function calculateShotStatistics(
  shots: readonly PracticeSessionShot[],
): ShotStatistics {
  const shotCount = shots.length;
  if (shotCount === 0) {
    return {
      shotCount,
      averageCarry: null,
      medianCarry: null,
      minimumCarry: null,
      maximumCarry: null,
      carryStandardDeviation: null,
      averageAbsoluteDistanceFromTargetLine: null,
      sideDeviationStandardDeviation: null,
    };
  }

  const carryValues = shots.map((shot) => shot.carry);
  const averageCarry =
    carryValues.reduce((sum, value) => sum + value, 0) / shotCount;
  const sortedCarryValues = [...carryValues].sort((a, b) => a - b);
  const middleIndex = Math.floor(shotCount / 2);
  const medianCarry =
    shotCount % 2 === 1
      ? sortedCarryValues[middleIndex]
      : (sortedCarryValues[middleIndex - 1] + sortedCarryValues[middleIndex]) /
        2;
  const averageAbsoluteDistanceFromTargetLine =
    shots.reduce((sum, shot) => sum + Math.abs(shot.carrySide), 0) / shotCount;

  // Population standard deviation describes the complete selected dataset.
  const carryStandardDeviation =
    shotCount < 2
      ? null
      : Math.sqrt(
          carryValues.reduce(
            (sum, value) => sum + (value - averageCarry) ** 2,
            0,
          ) / shotCount,
        );
  const averageSideDeviation =
    shots.reduce((sum, shot) => sum + shot.carrySide, 0) / shotCount;
  // Signed side deviations preserve left/right variation around the target line.
  const sideDeviationStandardDeviation =
    shotCount < 2
      ? null
      : Math.sqrt(
          shots.reduce(
            (sum, shot) =>
              sum + (shot.carrySide - averageSideDeviation) ** 2,
            0,
          ) / shotCount,
        );

  return {
    shotCount,
    averageCarry,
    medianCarry,
    minimumCarry: carryValues.reduce(
      (minimum, value) => Math.min(minimum, value),
      carryValues[0],
    ),
    maximumCarry: carryValues.reduce(
      (maximum, value) => Math.max(maximum, value),
      carryValues[0],
    ),
    carryStandardDeviation,
    averageAbsoluteDistanceFromTargetLine,
    sideDeviationStandardDeviation,
  };
}
