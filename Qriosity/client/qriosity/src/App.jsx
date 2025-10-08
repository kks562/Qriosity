// src/App.jsx

import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import { AuthProvider, AuthContext } from "./Components/AuthContext";

// Import Components
import Login from "./Components/Login";
import Register from "./Components/Register";
import Questions from "./Components/Questions";
import QuestionDetail from "./Components/QuestionDetail";
import Profile from "./Components/Profile";
import Notifications from "./Components/Notifications";

// Import Styles and Icons
import "./Components/Navbar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faRightFromBracket, faBell } from "@fortawesome/free-solid-svg-icons";

import axios from "axios";

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const notifRef = useRef();

  const handleLogout = () => {
    logout();
    setUnreadCount(0);
    setShowNotifications(false);
    navigate("/login");
  };

  // Fetch unread count periodically
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    let cancelled = false;

    const fetchUnread = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/notifications/unread-count",
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        if (!cancelled) setUnreadCount(res.data.unread || 0);
      } catch (err) {
        console.error("Unread count fetch error:", err);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 60000); // Refresh every 60s
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close notifications when route changes
  useEffect(() => {
    setShowNotifications(false);
  }, [location]);

  const isAuthPage =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/register";

  return (
    <>
      {!isAuthPage && (
        <nav className="navbar">
          <div className="navbar-container">
            <Link to="/questions" className="navbar-logo">
              Qriosity
            </Link>

            {user && (
              <div className="navbar-user-controls">
                <span className="navbar-greeting">Hello, {user.name}</span>

                <div className="notification-wrapper" ref={notifRef}>
                  <div
                    onClick={() => setShowNotifications(!showNotifications)}
                    style={{ cursor: "pointer" }}
                  >
                    <FontAwesomeIcon
                      icon={faBell}
                      className="navbar-notification-bell"
                    />
                    {unreadCount > 0 && (
                      <span className="unread-count-badge">{unreadCount}</span>
                    )}
                  </div>

                  {showNotifications && (
                    <div className="notifications-dropdown">
                      <Notifications setUnreadCount={setUnreadCount} />
                    </div>
                  )}
                </div>

                <Link
                  to={`/profile/${user.id}`}
                  className="navbar-profile-link"
                  title="View Profile"
                >
                  <div className="navbar-avatar placeholder">
                    <FontAwesomeIcon icon={faUser} />
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="navbar-logout-btn"
                  title="Logout"
                >
                  <FontAwesomeIcon icon={faRightFromBracket} /> Logout
                </button>
              </div>
            )}
          </div>
        </nav>
      )}

      <div className="main-content">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/questions/:id" element={<QuestionDetail />} />
          <Route path="/profile/:userId" element={<Profile />} />
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
