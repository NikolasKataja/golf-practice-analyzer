import { Link, NavLink } from "react-router";
import "./AppHeader.css";

export default function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link className="app-header__brand" to="/dashboard">
          Golf Practice Analyzer
        </Link>

        <nav className="app-header__nav" aria-label="Main navigation">
          <NavLink to="/dashboard" end>
            Dashboard
          </NavLink>
          <NavLink to="/compare" end>
            Compare
          </NavLink>
          <NavLink to="/account" end>
            Account
          </NavLink>
        </nav>
      </div>
    </header>
  );
}