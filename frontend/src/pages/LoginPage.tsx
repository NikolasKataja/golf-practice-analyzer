import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate, Link, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import AuthLayout from "../components/auth/AuthLayout";
import AuthInput from "../components/auth/AuthInput";
import GolfBall from "../components/3d/GolfBall";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Read optional navigation feedback without assuming its structure.
  const routeState: unknown = location.state;
  const successMessage =
    typeof routeState === "object" &&
    routeState !== null &&
    "message" in routeState &&
    typeof routeState.message === "string"
      ? routeState.message
      : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Prevent rapid repeated submissions.
    if (submitting.current) return;

    submitting.current = true;
    setError("");
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      setPassword("");

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      visual={<GolfBall />}
      footer={
        <p>
          No account yet? <Link to="/register">Create an account</Link>
        </p>
      }
    >
      {successMessage && !error && (
        <p role="status">{successMessage}</p>
      )}

      <form onSubmit={handleSubmit} aria-busy={isSubmitting}>
        <fieldset disabled={isSubmitting}>
          <legend className="auth-layout__legend">
            Sign-in details
          </legend>

          <AuthInput
            id="login-email"
            label="Email"
            type="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={256}
            required
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
          />

          <AuthInput
            id="login-password"
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
          />

          {error && <p role="alert">{error}</p>}

          <button type="submit">
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </fieldset>
      </form>
    </AuthLayout>
  );
}
