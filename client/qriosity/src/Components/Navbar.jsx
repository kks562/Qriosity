import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Qriosity
        </Link>
        <div className="navbar-links">
          <Link to="/questions" className="navbar-link">
            Questions
          </Link>
          <Link to="/register" className="navbar-link">
            Register
          </Link>
          <Link to="/login" className="navbar-link">
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
}
