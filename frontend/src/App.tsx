import { Navigate, Route, Routes } from 'react-router'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { useAuth } from './hooks/useAuth'
import AccountPage from './pages/AccountPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

export default function App() {
  const { isLoading, error, refreshSession } = useAuth()

  // Wait for the initial session check before deciding which page to show
  if (isLoading) {
    return (
      <main>
        <p role="status">Checking your session...</p>
      </main>
    )
  }

  // A failed request is different from being signed out
  // Offer a retry instead of silently redirecting to login
  if (error) {
    return (
      <main>
        <p role="alert">{error}</p>
        <button onClick={() => void refreshSession()}>
          Try again
        </button>
      </main>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/account" element={<AccountPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/account" replace />} />

      <Route
        path="*"
        element={
          <main>
            <h1>Page not found</h1>
            <a href="/">Return to the application</a>
          </main>
        }
      />
    </Routes>
  )
}