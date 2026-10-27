import type { ReactNode } from "react";
import "./AuthLayout.css";

type AuthLayoutProps = {
  title: string;
  children: ReactNode;
  footer: ReactNode;
  visual?: ReactNode;
};

export default function AuthLayout({
  title,
  children,
  footer,
  visual,
}: AuthLayoutProps) {
  return (
    <main className="auth-layout">
      <div className="auth-layout__content">
        {/* Show the app name above the shared authentication card. */}
        <p className="auth-layout__brand">Golf Practice Analyzer</p>

        <div className="auth-layout__card">
          {/* The ball is decorative and does not need a screen reader label. */}
          {visual && (
            <div className="auth-layout__visual-panel" aria-hidden="true">
              <div className="auth-layout__visual">{visual}</div>
            </div>
          )}

          <section
            className="auth-layout__panel"
            aria-labelledby="auth-title"
          >
            <h1 id="auth-title">{title}</h1>

            {children}

            <div className="auth-layout__footer">{footer}</div>
          </section>
        </div>
      </div>
    </main>
  );
}