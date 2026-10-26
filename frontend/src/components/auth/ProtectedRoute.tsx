import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../../hooks/useAuth'

export default function ProtectedRoute() {
  const { user } = useAuth()

  // This controls navigation in the UI
  // The backend independently enforces access with [Authorize]
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Render the matching child route when the user is signed in
  return <Outlet />
}