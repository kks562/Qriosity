import { Routes, Route, Link } from "react-router-dom";
import { AuthProvider } from "./Components/AuthContext";
import Login from "./Components/Login";
import Register from "./Components/Register";
import Questions from "./Components/Questions";
import QuestionDetail from "./Components/QuestionDetail";
import "./Components/Navbar.css"; // Navbar styling

export default function App() {
  return (
    <AuthProvider>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            Qriosity
          </Link>
          <div className="navbar-links">
            <Link to="/register" className="navbar-link">Register</Link>
            <Link to="/login" className="navbar-link">Login</Link>
          </div>
        </div>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Login />} /> {/* default page */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/questions" element={<Questions />} />
        <Route path="/questions/:id" element={<QuestionDetail />} />
      </Routes>
    </AuthProvider>
  );
}
