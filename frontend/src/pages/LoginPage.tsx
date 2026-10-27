import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate, Link, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import AuthLayout from "../components/auth/AuthLayout";
import GolfBall from "../components/3d/GolfBall";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const location = useLocation();

  // Read optional navigation feedback without assuming its structure
  const routeState: unknown = location.state;
  const successMessage =
    typeof routeState === "object" &&
    routeState !== null &&
    "message" in routeState &&
    typeof routeState.message === "string"
      ? routeState.message
      : null;

  // Form values and submission feedback belong to this page
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Signed-in users do not need to see the login form
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Handle submission without reloading the browser page
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      setPassword("");

      // Replace the login entry in browser history
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Sign-in failed.");
    } finally {
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
      {successMessage && !error && <p role="status">{successMessage}</p>}

      <form onSubmit={handleSubmit} aria-busy={isSubmitting}>
        <fieldset disabled={isSubmitting}>
          <legend className="auth-layout__legend">Sign-in details</legend>

          <p>
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              maxLength={256}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </p>

          <p>
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </p>

          {error && <p role="alert">{error}</p>}

          <button type="submit">
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </fieldset>
      </form>
    </AuthLayout>
  );
}
