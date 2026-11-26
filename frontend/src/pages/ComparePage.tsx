import { useEffect, useState } from "react";
import {
  getPracticeSession,
  getPracticeSessions,
  type PracticeSessionDetails,
  type PracticeSessionSummary,
} from "../api/practiceSessions";
import type { PracticeSessionShot } from "../api/practiceSessions";
import AppHeader from "../components/layout/AppHeader";
import ComparisonTable from "../components/practiceSessions/ComparisonTable";
import ComparisonDispersionChart from "../components/practiceSessions/ComparisonDispersionChart";
import ComparisonSummary from "../components/practiceSessions/ComparisonSummary";
import { TARGET_ZONE_HALF_WIDTH_METERS } from "../components/practiceSessions/targetZone";
import { calculateShotStatistics } from "../utils/shotStatistics";
import "./ComparePage.css";

type SessionSelection = {
  sessionAId: number | null;
  sessionBId: number | null;
  club: string;
};

type DetailState =
  | {
      sessionAId: number;
      sessionBId: number;
      status: "ready";
      sessionA: PracticeSessionDetails;
      sessionB: PracticeSessionDetails;
    }
  | {
      sessionAId: number;
      sessionBId: number;
      status: "error";
      message: string;
    };

function compareRecentSessions(
  a: PracticeSessionSummary,
  b: PracticeSessionSummary,
) {
  return b.practiceDate.localeCompare(a.practiceDate) || b.id - a.id;
}

function getTargetZonePercentage(shots: PracticeSessionShot[]) {
  if (shots.length === 0) return null;
  const shotsWithinZone = shots.filter(
    (shot) =>
      shot.carrySide >= -TARGET_ZONE_HALF_WIDTH_METERS &&
      shot.carrySide <= TARGET_ZONE_HALF_WIDTH_METERS,
  ).length;
  return (shotsWithinZone / shots.length) * 100;
}

function getCommonClubs(
  sessionA: PracticeSessionDetails,
  sessionB: PracticeSessionDetails,
) {
  const clubsB = new Set(sessionB.shots.map((shot) => shot.club));
  return [...new Set(sessionA.shots.map((shot) => shot.club))]
    .filter((club) => clubsB.has(club))
    .sort((a, b) => a.localeCompare(b));
}

export default function ComparePage() {
  const [sessions, setSessions] = useState<PracticeSessionSummary[]>([]);
  const [listStatus, setListStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [listError, setListError] = useState("");
  const [selection, setSelection] = useState<SessionSelection>({
    sessionAId: null,
    sessionBId: null,
    club: "",
  });
  const [details, setDetails] = useState<DetailState | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSessions() {
      try {
        const data = (await getPracticeSessions(controller.signal)).sort(
          compareRecentSessions,
        );
        if (controller.signal.aborted) return;

        setSessions(data);
        setListStatus("ready");
        setSelection({
          sessionAId: data[1]?.id ?? null,
          sessionBId: data[0]?.id ?? null,
          club: "",
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          setListError(
            error instanceof Error
              ? error.message
              : "Could not load practice sessions.",
          );
          setListStatus("error");
        }
      }
    }

    void loadSessions();
    return () => controller.abort();
  }, []);

  const sessionAId = selection.sessionAId;
  const sessionBId = selection.sessionBId;

  useEffect(() => {
    if (sessionAId === null || sessionBId === null) return;

    const idA = sessionAId;
    const idB = sessionBId;
    const controller = new AbortController();

    async function loadDetails() {
      try {
        const [sessionA, sessionB] = await Promise.all([
          getPracticeSession(idA, controller.signal),
          getPracticeSession(idB, controller.signal),
        ]);
        if (!controller.signal.aborted) {
          setDetails({
            sessionAId: idA,
            sessionBId: idB,
            status: "ready",
            sessionA,
            sessionB,
          });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setDetails({
            sessionAId: idA,
            sessionBId: idB,
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Could not load practice session details.",
          });
        }
      }
    }

    void loadDetails();
    return () => controller.abort();
  }, [sessionAId, sessionBId]);

  const currentDetails =
    details?.sessionAId === sessionAId &&
    details.sessionBId === sessionBId
      ? details
      : null;
  const sessionA =
    currentDetails?.status === "ready" ? currentDetails.sessionA : null;
  const sessionB =
    currentDetails?.status === "ready" ? currentDetails.sessionB : null;
  const commonClubs =
    sessionA && sessionB ? getCommonClubs(sessionA, sessionB) : [];
  const selectedClub = commonClubs.includes(selection.club)
    ? selection.club
    : (commonClubs[0] ?? "");

  const shotsA =
    sessionA?.shots.filter((shot) => shot.club === selectedClub) ?? [];
  const shotsB =
    sessionB?.shots.filter((shot) => shot.club === selectedClub) ?? [];
  const statisticsA = calculateShotStatistics(shotsA);
  const statisticsB = calculateShotStatistics(shotsB);
  const targetZonePercentageA = getTargetZonePercentage(shotsA);
  const targetZonePercentageB = getTargetZonePercentage(shotsB);

  function changeSession(session: "A" | "B", sessionId: number) {
    setSelection((current) => ({
      ...current,
      sessionAId: session === "A" ? sessionId : current.sessionAId,
      sessionBId: session === "B" ? sessionId : current.sessionBId,
      club: "",
    }));
  }

  return (
    <>
      <AppHeader />
      <main className="page-content compare-page">
        <header className="compare-page__intro">
          <h1>Compare practice sessions</h1>
          <p>Compare your shot performance between two practice sessions.</p>
        </header>

        {listStatus === "loading" ? (
          <p className="compare-page__message" role="status">
            Loading practice sessions…
          </p>
        ) : listStatus === "error" ? (
          <p
            className="compare-page__message compare-page__error"
            role="alert"
          >
            {listError}
          </p>
        ) : sessions.length < 2 ? (
          <p className="compare-page__message">
            At least two practice sessions are needed to compare performance.
          </p>
        ) : (
          <>
            <section
              className="compare-page__filters"
              aria-label="Comparison selections"
            >
              <label>
                <span>Practice session A</span>
                <select
                  value={sessionAId ?? ""}
                  onChange={(event) =>
                    changeSession("A", Number(event.currentTarget.value))
                  }
                >
                  {sessions
                    .filter((session) => session.id !== sessionBId)
                    .map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                <span>Practice session B</span>
                <select
                  value={sessionBId ?? ""}
                  onChange={(event) =>
                    changeSession("B", Number(event.currentTarget.value))
                  }
                >
                  {sessions
                    .filter((session) => session.id !== sessionAId)
                    .map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                <span>Club</span>
                <select
                  value={selectedClub}
                  disabled={commonClubs.length === 0}
                  onChange={(event) => {
                    const club = event.currentTarget.value;
                    setSelection((current) => ({
                      ...current,
                      club,
                    }));
                  }}
                >
                  {commonClubs.map((club) => (
                    <option key={club} value={club}>
                      {club}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            {!currentDetails && sessionAId !== null && sessionBId !== null ? (
              <p className="compare-page__message" role="status">
                Loading selected practice sessions…
              </p>
            ) : currentDetails?.status === "error" ? (
              <p className="compare-page__message compare-page__error" role="alert">
                {currentDetails.message}
              </p>
            ) : sessionA && sessionB && commonClubs.length === 0 ? (
              <p className="compare-page__message">
                {sessionA.shots.length === 0 || sessionB.shots.length === 0
                  ? "Both sessions need shots to compare."
                  : "The selected sessions have no clubs in common."}
              </p>
            ) : sessionA && sessionB ? (
              <>
                <div className="compare-page__results">
                  <ComparisonTable
                    sessionAName={sessionA.name}
                    sessionBName={sessionB.name}
                    statisticsA={statisticsA}
                    statisticsB={statisticsB}
                    targetZonePercentageA={targetZonePercentageA}
                    targetZonePercentageB={targetZonePercentageB}
                  />
                  <ComparisonDispersionChart
                    sessionAName={sessionA.name}
                    sessionBName={sessionB.name}
                    shotsA={shotsA}
                    shotsB={shotsB}
                  />
                </div>
                <ComparisonSummary
                  statisticsA={statisticsA}
                  statisticsB={statisticsB}
                  targetZonePercentageA={targetZonePercentageA}
                  targetZonePercentageB={targetZonePercentageB}
                />
              </>
            ) : null}
          </>
        )}
      </main>
    </>
  );
}
