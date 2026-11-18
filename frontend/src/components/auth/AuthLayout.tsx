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
        <section
          className="auth-layout__card"
          aria-labelledby="auth-title"
        >
          {/* Keep the decorative 3D visual separate from form content. */}
          {visual && (
            <div className="auth-layout__visual" aria-hidden="true">
              {visual}
            </div>
          )}

          <header className="auth-layout__header">
            <p className="auth-layout__brand">
              Golf Practice Analyzer
            </p>
            <h1 id="auth-title">{title}</h1>
          </header>

          <div className="auth-layout__panel">
            {children}
          </div>

          <footer className="auth-layout__footer">
            {footer}
          </footer>
        </section>
      </div>
    </main>
  );
}