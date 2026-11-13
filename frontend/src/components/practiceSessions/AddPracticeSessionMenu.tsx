import { Link } from "react-router";

export default function AddPracticeSessionMenu() {
  return (
    <details>
      <summary>Add a practice session</summary>

      <nav aria-label="Choose how to add a practice session">
        <ul>
          <li>
            <Link to="/practice-sessions/import">Import CSV file</Link>
            <p>Upload a practice session exported from SwingSync.</p>
          </li>

          <li>
            <Link to="/practice-sessions/create">Enter shots manually</Link>
            <p>Add a practice session by entering your shot results.</p>
          </li>
        </ul>
      </nav>
    </details>
  );
}
