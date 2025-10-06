import { useState, useContext } from "react";
import API from "./axios";
import { AuthContext } from "../Components/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Register.css"; // import the CSS file

export default function Register() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/register", form);
      login(res.data.token, res.data.user);
      navigate("/questions");
    } catch (err) {
      alert(err.response?.data?.msg || "Error");
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2 className="register-title">Create Account</h2>
        <form onSubmit={handleSubmit} className="register-form">
          <input
            placeholder="Name"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="register-input"
          />
          <input
            placeholder="Email"
            type="email"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="register-input"
          />
          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="register-input"
          />
          <button className="register-button">Register</button>
        </form>
        <p className="register-footer">
          Already have an account?{" "}
          <a href="/login" className="register-link">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
