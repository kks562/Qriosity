import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthProvider, AuthContext } from "./Components/AuthContext";
import Login from "./Components/Login";
import Register from "./Components/Register";
import Questions from "./Components/Questions";
import QuestionDetail from "./Components/QuestionDetail";
import "./Components/Navbar.css";

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();               // Remove token and user info
    navigate("/register");  // Redirect to register page
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/questions" className="navbar-logo">
          Qriosity
        </Link>
        {user && (
          <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "15px",
  }}
>
  <span
    style={{
      fontWeight: 500,
      color: "blue",
    }}
  >
    Hello, {user.name}
  </span>
  <button
    onClick={handleLogout}
    style={{
      backgroundColor: "#ff4d4f",
      color: "white",
      border: "none",
      padding: "6px 12px",
      borderRadius: "5px",
      cursor: "pointer",
      fontWeight: "bold",
    }}
    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#ff7875")}
    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#ff4d4f")}
  >
    Logout
  </button>
</div>

        )}
      </div>
    </nav>
  );
}

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/" || location.pathname === "/login" || location.pathname === "/register";

  return (
    <>
      {!isAuthPage && <Navbar />}  {/* Show navbar only on non-auth pages */}

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/questions" element={<Questions />} />
        <Route path="/questions/:id" element={<QuestionDetail />} />
      </Routes>
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
