import { useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { PracticeSessionShot } from "../../api/practiceSessions";
import styles from "./ShotDetailsPopover.module.css";

type Props = {
  shot: PracticeSessionShot;
  sessionName?: string;
  anchor: SVGElement;
  onDismiss: () => void;
};

const numberFormat = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
});

function formatValue(value: number | null, unit: string) {
  return value === null ? "—" : `${numberFormat.format(value)} ${unit}`;
}

export default function ShotDetailsPopover({
  shot,
  sessionName,
  anchor,
  onDismiss,
}: Props) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    function updatePosition() {
      const popover = popoverRef.current;
      if (!popover || !anchor.isConnected) return;

      const anchorRect = anchor.getBoundingClientRect();
      const popoverRect = popover.getBoundingClientRect();
      const gap = 8;
      const edge = 8;
      const maxLeft = Math.max(edge, window.innerWidth - popoverRect.width - edge);
      const left = Math.min(
        maxLeft,
        Math.max(edge, anchorRect.left + anchorRect.width / 2 - popoverRect.width / 2),
      );
      const maxTop = Math.max(edge, window.innerHeight - popoverRect.height - edge);
      const top =
        anchorRect.top >= popoverRect.height + gap
          ? anchorRect.top - popoverRect.height - gap
          : anchorRect.bottom + popoverRect.height + gap <= window.innerHeight
            ? anchorRect.bottom + gap
            : Math.min(maxTop, Math.max(edge, anchorRect.top - popoverRect.height / 2));

      popover.style.left = `${left}px`;
      popover.style.top = `${top}px`;
      popover.style.visibility = "visible";
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchor]);

  useEffect(() => {
    function dismissOutside(event: PointerEvent) {
      const target = event.target;
      if (
        target instanceof Node &&
        !anchor.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        onDismiss();
      }
    }

    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onDismiss();
        anchor.focus();
      }
    }

    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [anchor, onDismiss]);

  useEffect(() => {
    popoverRef.current?.focus();
  }, [anchor, shot.id]);

  return createPortal(
    <div
      ref={popoverRef}
      className={styles.popover}
      role="dialog"
      aria-label={`Details for shot ${shot.shotNumber}`}
      tabIndex={-1}
    >
      <div className={styles.header}>
        <h3>Shot {shot.shotNumber}</h3>
        <button type="button" onClick={onDismiss} aria-label="Close shot details">
          ×
        </button>
      </div>
      <dl>
        {sessionName && (
          <div>
            <dt>Practice session</dt>
            <dd>{sessionName}</dd>
          </div>
        )}
        <div>
          <dt>Club</dt>
          <dd>{shot.club}</dd>
        </div>
        <div>
          <dt>Carry</dt>
          <dd>{formatValue(shot.carry, "m")}</dd>
        </div>
        <div>
          <dt>Side deviation</dt>
          <dd>{formatValue(shot.carrySide, "m")}</dd>
        </div>
        <div>
          <dt>Ball speed</dt>
          <dd>{formatValue(shot.ballSpeed, "km/h")}</dd>
        </div>
        <div>
          <dt>Vertical launch angle</dt>
          <dd>{formatValue(shot.launchAngle, "°")}</dd>
        </div>
        <div>
          <dt>Peak height</dt>
          <dd>{formatValue(shot.peakHeight, "m")}</dd>
        </div>
        <div>
          <dt>Total distance</dt>
          <dd>{formatValue(shot.totalDistance, "m")}</dd>
        </div>
      </dl>
    </div>,
    document.body,
  );
}
