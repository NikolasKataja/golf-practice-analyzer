import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { authPost } from "../api/auth";
import { useAuth } from "../hooks/useAuth";
import AuthLayout from "../components/auth/AuthLayout";
import GolfBall from "../components/3d/GolfBall";

export default function RegisterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Signed-in users already have an account
  if (user) {
    return <Navigate to="/account" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    // Confirm the password locally before sending it to the backend
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await authPost("register", {
        email: email.trim(),
        password,
      });

      setPassword("");
      setConfirmPassword("");

      // Registration does not create a signed-in session
      // Pass a success message to the login page through router state
      navigate("/login", {
        replace: true,
        state: { message: "Account created. You can now sign in." },
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Account creation failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create an account"
      visual={<GolfBall />} 
      footer={
        <p>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} aria-busy={isSubmitting}>
        <fieldset disabled={isSubmitting}>
          <legend className="auth-layout__legend">Account details</legend>

          <p>
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              autoComplete="username"
              maxLength={256}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </p>

          <div>
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              aria-describedby="password-help"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <p id="password-help" className="auth-layout__hint">
              Use at least 12 characters.
            </p>
          </div>

          <p>
            <label htmlFor="confirm-password">Confirm password</label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </p>

          {error && <p role="alert">{error}</p>}

          <button type="submit">
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </fieldset>
      </form>
    </AuthLayout>
  );
}
