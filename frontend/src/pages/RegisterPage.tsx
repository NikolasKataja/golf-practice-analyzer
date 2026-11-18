import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { authPost } from "../api/auth";
import { useAuth } from "../hooks/useAuth";
import AuthLayout from "../components/auth/AuthLayout";
import AuthInput from "../components/auth/AuthInput";
import GolfBall from "../components/3d/GolfBall";

export default function RegisterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);

  if (user) {
    return <Navigate to="/account" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting.current) return;

    setError("");

    // Confirm the password before sending the request.
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    submitting.current = true;
    setIsSubmitting(true);

    try {
      await authPost("register", {
        email: email.trim(),
        password,
      });

      setPassword("");
      setConfirmPassword("");

      // Registration does not create a signed-in session.
      navigate("/login", {
        replace: true,
        state: { message: "Account created. You can now sign in." },
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Account creation failed.",
      );
    } finally {
      submitting.current = false;
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
          <legend className="auth-layout__legend">
            Account details
          </legend>

          <AuthInput
            id="register-email"
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

          <div>
            <AuthInput
              id="register-password"
              label="Password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              aria-describedby="password-help"
              required
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
            />

            <p id="password-help" className="auth-layout__hint">
              Use at least 12 characters.
            </p>
          </div>

          <AuthInput
            id="confirm-password"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.currentTarget.value)
            }
          />

          {error && <p role="alert">{error}</p>}

          <button type="submit">
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </fieldset>
      </form>
    </AuthLayout>
  );
}
