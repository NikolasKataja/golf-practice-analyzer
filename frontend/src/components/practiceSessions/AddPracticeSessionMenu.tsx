import { Link } from "react-router";
import "./AddPracticeSessionMenu.css";

export default function AddPracticeSessionMenu() {
  return (
    <details className="add-session-menu">
      <summary className="add-session-menu__trigger">
        <span aria-hidden="true">+</span>
        Add a practice session
      </summary>

      <nav
        className="add-session-menu__panel"
        aria-label="Choose how to add a practice session"
      >
        <ul>
          <li>
            <Link to="/practice-sessions/import">
              <strong>Import CSV file</strong>
              <span>Upload a practice session exported from SwingSync.</span>
            </Link>
          </li>
          <li>
            <Link to="/practice-sessions/create">
              <strong>Enter shots manually</strong>
              <span>Enter your shot results one by one.</span>
            </Link>
          </li>
        </ul>
      </nav>
    </details>
  );
}
