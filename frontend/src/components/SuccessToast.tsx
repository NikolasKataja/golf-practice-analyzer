import { useEffect, useRef, useState } from "react";
import styles from "./SuccessToast.module.css";

type Props = {
  title: string;
  message?: string;
  onDismiss: () => void;
};

export default function SuccessToast({ title, message, onDismiss }: Props) {
  const [isExiting, setIsExiting] = useState(false);
  const isExitingRef = useRef(false);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      isExitingRef.current = true;
      setIsExiting(true);
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <div
      className={`${styles.toast} ${isExiting ? styles.exiting : ""}`}
      role="status"
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget && isExiting) {
          onDismissRef.current();
        }
      }}
    >
      <div>
        <strong>{title}</strong>
        {message && <p>{message}</p>}
      </div>
      <button
        type="button"
        className={styles.close}
        aria-label="Dismiss notification"
        onClick={() => {
          if (isExitingRef.current) return;
          isExitingRef.current = true;
          setIsExiting(true);
        }}
      >
        ×
      </button>
    </div>
  );
}
