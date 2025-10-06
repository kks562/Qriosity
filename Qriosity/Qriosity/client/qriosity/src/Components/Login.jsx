import { useState, useContext } from "react";
import API from "./axios";
import { AuthContext } from "../Components/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Login.css"; // import CSS

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/login", form);
      login(res.data.token, res.data.user);
      navigate("/questions");
    } catch (err) {
      alert(err.response?.data?.msg || "Error");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Login</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <input
            placeholder="Email"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="login-input"
          />
          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="login-input"
          />
          <button className="login-button">Login</button>
        </form>
        <p className="login-footer">
          Don't have an account?{" "}
          <a href="/register" className="login-link">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}
