import { Link } from 'react-router'
import PracticeSessionList from '../components/practiceSessions/PracticeSessionList'

export default function DashboardPage() {
  return (
    <main>
      <h1>Dashboard</h1>

      <nav aria-label="Dashboard navigation">
        <p>
          <Link to="/account">Go to Account</Link>
        </p>
        <p>
          <Link to="/practice-sessions/import">
            Import practice session
          </Link>
        </p>
      </nav>

      <PracticeSessionList />
    </main>
  )
}