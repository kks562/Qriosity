import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const location = useLocation();
  
  // Logic to hide the nav is now handled in App.js, but keeping this component clean.
  
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/questions" className="navbar-logo">
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
