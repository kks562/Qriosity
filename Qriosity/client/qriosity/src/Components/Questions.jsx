import { useEffect, useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import axios from "axios";
import "./Questions.css";

export default function Questions() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ title: "", body: "", tags: "" });

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Fetch all questions
  const fetchQuestions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/questions");
      setQuestions(res.data);
    } catch (err) {
      console.error("Backend fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Submit new question
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newQuestion.title.trim() || !newQuestion.body.trim()) return;
    if (!user?.token) return alert("You must log in to post a question!");

    try {
      await axios.post("http://localhost:5000/api/questions", newQuestion, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setNewQuestion({ title: "", body: "", tags: "" });
      setShowForm(false);
      fetchQuestions();
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to post question");
    }
  };

  // Delete question
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/questions/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      fetchQuestions();
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to delete question");
    }
  };

  // Vote question
  const handleVote = async (id, vote) => {
    if (!user?.token) return alert("Login to vote");
    try {
      await axios.patch(
        `http://localhost:5000/api/questions/${id}/vote`,
        { vote },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      fetchQuestions();
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to vote");
    }
  };

  // Live search suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      const trimmed = searchQuery.trim();
      if (!trimmed) return setSuggestions([]);

      setSearchLoading(true);
      try {
        const res = await axios.get("http://localhost:5000/api/questions/search", {
          params: { query: trimmed, sort: "date" },
        });
        setSuggestions(res.data.slice(0, 5)); // top 5 suggestions
      } catch (err) {
        console.error("Search failed:", err);
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300); // debounce 300ms
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSuggestionClick = (id) => {
    navigate(`/questions/${id}`);
    setSearchQuery("");
    setSuggestions([]);
  };

  return (
    <div className="questions-container">
      <div className="questions-header">
        <h2>All Questions</h2>

        {/* Search bar */}
        <div className="wide-search-form" style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button onClick={() => suggestions.length && handleSuggestionClick(suggestions[0]._id)}>Search</button>

          {/* Suggestions dropdown */}
          {searchQuery && suggestions.length > 0 && (
            <ul className="suggestions-dropdown">
              {suggestions.map((q) => (
                <li key={q._id} onClick={() => handleSuggestionClick(q._id)}>
                  {q.title}
                </li>
              ))}
            </ul>
          )}
        </div>

        {user ? (
          <button className="ask-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Ask Question"}
          </button>
        ) : (
          <Link to="/login" className="ask-btn">
            Login to Ask
          </Link>
        )}
      </div>

      {/* Add new question form */}
      {showForm && user && (
        <form className="add-question-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Title"
            value={newQuestion.title}
            onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Body"
            value={newQuestion.body}
            onChange={(e) => setNewQuestion({ ...newQuestion, body: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Tags (comma separated)"
            value={newQuestion.tags}
            onChange={(e) => setNewQuestion({ ...newQuestion, tags: e.target.value })}
          />
          <button type="submit" className="submit-btn">
            Post Question
          </button>
        </form>
      )}

      {/* Display questions */}
      <ul className="questions-list">
        {questions.map((q) => (
          <li key={q._id} className="question-card">
            <div className="question-header">
              <span className="question-title clickable" onClick={() => navigate(`/questions/${q._id}`)}>
                {q.title}
              </span>

              {user && q.author && user.id === q.author._id && (
                <button className="delete-btn" onClick={() => handleDelete(q._id)}>
                  Delete
                </button>
              )}
            </div>

            <div className="question-meta">
              <span>{q.answers?.length || 0} answers</span>
              <span>{" • " + new Date(q.createdAt).toLocaleDateString()}</span>
              <span>{" • Author: " + (q.author?.name || "Anonymous")}</span>
            </div>

            <div className="question-votes">
              <button onClick={() => handleVote(q._id, 1)}>👍 {q.upvotes || 0}</button>
              <button onClick={() => handleVote(q._id, -1)}>👎</button>
            </div>
          </li>
        ))}
      </ul>

      {searchLoading && <p>Searching...</p>}
    </div>
  );
}
