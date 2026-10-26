import { useNavigate } from 'react-router' 

export default function DashboardPage() {
  const navigate = useNavigate()
  return (
    <main>
      <h1>Dashboard</h1>
      <button onClick={() => void navigate('/account')}>
        Go to Account
      </button>
    </main>
  )
}

