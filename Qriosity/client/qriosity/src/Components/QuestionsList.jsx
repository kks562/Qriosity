import { useEffect, useState, useContext } from "react";
import { AuthContext } from "./AuthContext";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Questions.css"; // Ensure styling is applied

export default function QuestionsList() {
  const { user } = useContext(AuthContext);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/questions");
      setQuestions(res.data);
    } catch (err) {
      console.error("Failed to fetch questions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Delete a question
  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/questions/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      fetchQuestions(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to delete question");
    }
  };

  if (loading) return <p>Loading questions...</p>;
  if (!questions.length) return <p>No questions available.</p>;

  return (
    <div className="questions-container">
      <h2>Latest Questions</h2>
      <ul className="questions-list">
        {questions.map((q) => (
          <li key={q._id} className="question-card">
            <div className="question-header">
              <Link to={`/questions/${q._id}`} className="question-title">
                {q.title}
              </Link>
              {user && user.id === q.author?._id && (
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteQuestion(q._id)}
                >
                  Delete
                </button>
              )}
            </div>
            <div className="question-meta">
              <span>{q.answers?.length || 0} answers</span>
              <span>{" • "}{new Date(q.createdAt).toLocaleDateString()}</span>
              <span>{" • Author: "}{q.author?.name || "Anonymous"}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
