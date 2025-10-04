import { Routes, Route, Link, useLocation } from "react-router-dom";
import { AuthProvider } from "./Components/AuthContext";
import Login from "./Components/Login";
import Register from "./Components/Register";
import Questions from "./Components/Questions";
import QuestionDetail from "./Components/QuestionDetail";
import "./Components/Navbar.css"; // Navbar styling

// Inner component to handle conditional rendering using hooks
function AppContent() {
    const location = useLocation();

    // Determine if the current page is an authentication page
    // (Assuming the root path "/" also lands on the Login page, based on your routes)
    const isAuthPage = location.pathname === '/login' || 
                       location.pathname === '/register' ||
                       location.pathname === '/';

    return (
        <>
            {/* Conditional Navbar Rendering: Only show if NOT an auth page */}
            {!isAuthPage && (
                <nav className="navbar">
                    <div className="navbar-container">
                        <Link to="/questions" className="navbar-logo">
                            Qriosity
                        </Link>
                        <div className="navbar-links">
                            {/* NOTE: You should replace these links with actual user status (e.g., Logout) 
                                if the user is authenticated */}
                            <Link to="/register" className="navbar-link">Register</Link>
                            <Link to="/login" className="navbar-link">Login</Link>
                        </div>
                    </div>
                </nav>
            )}

            {/* Routes */}
            <Routes>
                <Route path="/" element={<Login />} /> {/* default page */}
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
            {/* The main content (with conditional Navbar) is rendered here */}
            <AppContent />
        </AuthProvider>
    );
}
