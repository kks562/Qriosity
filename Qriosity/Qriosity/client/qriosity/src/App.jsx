// src/App.jsx
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthProvider, AuthContext } from "./Components/AuthContext";
import Login from "./Components/Login";
import Register from "./Components/Register";
import Questions from "./Components/Questions";
import QuestionDetail from "./Components/QuestionDetail";
import Profile from "./Components/Profile"; // Profile component
import "./Components/Navbar.css";

// Font Awesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/questions" className="navbar-logo">
          Qriosity
        </Link>

        {user && (
          <div className="navbar-user-controls">
            <span className="navbar-greeting">Hello, {user.name}</span>

            {/* Profile Avatar */}
            <Link to={`/profile/${user.id}`} className="navbar-profile-link" title="View Profile">
  {user.avatar ? (
    <img
      src={`http://localhost:5000/${user.avatar.replace(/\\/g, "/")}`}
      alt="User Avatar"
      className="navbar-avatar"
    />
  ) : (
    <div className="navbar-avatar placeholder">
      <FontAwesomeIcon icon={faUser} />
    </div>
  )}
</Link>


            {/* Logout Button */}
            <button onClick={handleLogout} className="navbar-logout-btn">
              <FontAwesomeIcon icon={faRightFromBracket} /> Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

function AppContent() {
  const location = useLocation();
  const isAuthPage =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/register";

  return (
    <>
      {!isAuthPage && <Navbar />}
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/questions/:id" element={<QuestionDetail />} />
          <Route path="/profile/:userId" element={<Profile />} /> {/* Profile Route */}
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
