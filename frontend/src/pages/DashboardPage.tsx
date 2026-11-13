import { Link } from 'react-router'
import PracticeSessionList from '../components/practiceSessions/PracticeSessionList'
import AddPracticeSessionMenu from '../components/practiceSessions/AddPracticeSessionMenu'

export default function DashboardPage() {
  return (
    <main>
      <h1>Dashboard</h1>

      <nav aria-label="Dashboard navigation">
        <p>
          <Link to="/account">Go to Account</Link>
        </p>
      </nav>

      <AddPracticeSessionMenu />
      <PracticeSessionList />
    </main>
  )
}