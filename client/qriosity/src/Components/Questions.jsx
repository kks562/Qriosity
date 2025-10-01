import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import axios from "axios";
import "./Questions.css";

export default function Questions() {
  const { user } = useContext(AuthContext);
  const [questions, setQuestions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ title: "", body: "", tags: "" });

  // Fetch questions from backend
  const fetchBackendQuestions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/questions");
      setQuestions(res.data);
    } catch (err) {
      console.error("Backend fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchBackendQuestions();
  }, []);

  // Submit new question to backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newQuestion.title.trim() || !newQuestion.body.trim()) return;

    if (!user?.token) {
      alert("You must log in to post a question!");
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/api/questions",
        newQuestion,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setNewQuestion({ title: "", body: "", tags: "" });
      setShowForm(false);
      fetchBackendQuestions(); // refresh the list
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to post question");
    }
  };

  return (
    <div className="questions-container">
      <div className="questions-header">
        <h2>All Questions</h2>
        {user ? (
          <button className="ask-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Ask Question"}
          </button>
        ) : (
          <Link to="/login" className="ask-btn">Login to Ask</Link>
        )}
      </div>

      {showForm && user && (
        <form className="add-question-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Title"
            value={newQuestion.title}
            onChange={e => setNewQuestion({ ...newQuestion, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Body"
            value={newQuestion.body}
            onChange={e => setNewQuestion({ ...newQuestion, body: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Tags (comma separated)"
            value={newQuestion.tags}
            onChange={e => setNewQuestion({ ...newQuestion, tags: e.target.value })}
          />
          <button type="submit" className="submit-btn">Post Question</button>
        </form>
      )}

      <ul className="questions-list">
        {questions.map(q => (
          <li key={q._id} className="question-card">
            <Link to={`/questions/${q._id}`} className="question-title">{q.title}</Link>
            <div className="question-meta">
              <span>{q.answers?.length || 0} answers</span>
              <span>{" • "}{new Date(q.createdAt).toLocaleDateString()}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
