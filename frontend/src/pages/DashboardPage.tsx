import PracticeSessionList from "../components/practiceSessions/PracticeSessionList";
import AddPracticeSessionMenu from "../components/practiceSessions/AddPracticeSessionMenu";
import AppHeader from "../components/layout/AppHeader";
import "./DashboardPage.css";

export default function DashboardPage() {
  return (
    <>
      <AppHeader />

      <main className="dashboard">
        <div className="dashboard__intro">
          <div>
            <h1>Practice overview</h1>
            <p>Browse your practice sessions and review your shots.</p>
          </div>

          <AddPracticeSessionMenu />
        </div>

        <div className="dashboard__sessions">
          <PracticeSessionList />
        </div>
      </main>
    </>
  );
}