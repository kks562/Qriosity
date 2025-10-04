import { useEffect, useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import axios from "axios";
import "./Questions.css";

export default function Questions() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [displayedQuestions, setDisplayedQuestions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ title: "", body: "", tags: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchMode, setSearchMode] = useState("title");

  // --- Helper to get user's vote on a question ---
  const getUserVote = (q) => {
    if (!user || !q.userVotes || !Array.isArray(q.userVotes)) return 0;
    const foundVote = q.userVotes.find(v => v.user?.toString() === user.id);
    return foundVote ? foundVote.vote : 0;
  };

  // --- Fetch all questions ---
  const fetchQuestions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/questions");
      const questionsWithVote = res.data.map(q => ({ ...q, userVote: user ? getUserVote(q) : 0 }));
      setDisplayedQuestions(questionsWithVote);
    } catch (err) {
      console.error("Backend fetch failed:", err);
      setDisplayedQuestions([]);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [user]);

  // --- Vote logic ---
  const handleVote = async (id, voteDirection) => {
    if (!user?.token) return alert("Login to vote");
    const currentQuestion = displayedQuestions.find(q => q._id === id);
    if (!currentQuestion) return;

    const userVote = currentQuestion.userVote || 0;
    let newVoteAction = voteDirection === userVote ? 0 : voteDirection;

    setDisplayedQuestions(prev =>
      prev.map(q => {
        if (q._id !== id) return q;
        let upvotes = q.upvotes || 0;
        let downvotes = q.downvotes || 0;

        if (newVoteAction === 0) {
          if (userVote === 1) upvotes -= 1;
          if (userVote === -1) downvotes -= 1;
        } else {
          if (userVote === 1) upvotes -= 1;
          if (userVote === -1) downvotes -= 1;
          if (newVoteAction === 1) upvotes += 1;
          if (newVoteAction === -1) downvotes += 1;
        }

        return { ...q, upvotes, downvotes, userVote: newVoteAction };
      })
    );

    try {
      await axios.patch(
        `http://localhost:5000/api/questions/${id}/vote`,
        { vote: newVoteAction },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to vote");
      fetchQuestions();
    }
  };

  // --- Search logic ---
  const handleSearch = async () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return fetchQuestions();

    setSearchLoading(true);
    try {
      const params = {};
      if (searchMode === "title") params.query = trimmed;
      else if (searchMode === "tags") params.tags = trimmed;

      const res = await axios.get("http://localhost:5000/api/questions/search", { params });
      setDisplayedQuestions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Search failed:", err);
      setDisplayedQuestions([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // --- Live suggestions ---
  useEffect(() => {
    const fetchSuggestions = async () => {
      const trimmed = searchQuery.trim();
      if (!trimmed) return setSuggestions([]);

      setSearchLoading(true);
      try {
        const params = { limit: 5 };
        if (searchMode === "title") params.query = trimmed;
        else if (searchMode === "tags") params.tags = trimmed;

        const res = await axios.get("http://localhost:5000/api/questions/search", { params });
        setSuggestions(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Suggestions failed:", err);
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchMode]);

  const handleSuggestionClick = (id) => {
    navigate(`/questions/${id}`);
    setSearchQuery("");
    setSuggestions([]);
  };

  // --- Add question ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newQuestion.title.trim() || !newQuestion.body.trim()) return;
    if (!user?.token) return alert("Login to post question");

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

  // --- Delete question ---
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/questions/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setDisplayedQuestions(prev => prev.filter(q => q._id !== id));
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to delete question");
    }
  };

  return (
    <div className="questions-container">
      <div className="questions-header">
        <h2>All Questions</h2>
        <div className="header-actions">
          <div className="wide-search-form">
            <select
              className="search-mode-select"
              value={searchMode}
              onChange={(e) => {
                setSearchMode(e.target.value);
                setSearchQuery("");
                setSuggestions([]);
                fetchQuestions();
              }}
            >
              <option value="title">Search Title</option>
              <option value="tags">Search Tags</option>
            </select>

            <input
              type="text"
              placeholder={searchMode === "tags" ? "Search by Tag..." : "Search questions..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            />
            <button onClick={handleSearch} aria-label="Search">Search</button>

            {searchQuery && suggestions.length > 0 && (
              <ul className="suggestions-dropdown">
                {suggestions.map(q => (
                  <li key={q._id} onClick={() => handleSuggestionClick(q._id)}>
                    {q.title}
                  </li>
                ))}
              </ul>
            )}

            {searchLoading && <div className="spinner"></div>}
          </div>

          {user ? (
            <button className="ask-btn" onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "Ask Question"}
            </button>
          ) : (
            <Link to="/login" className="ask-btn">Login to Ask</Link>
          )}
        </div>
      </div>

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
          <button type="submit" className="submit-btn">Post Question</button>
        </form>
      )}

      <ul className="questions-list">
        {displayedQuestions.map(q => (
          <li key={q._id} className="question-card">
            <div className="card-left-section">
              <div className="question-votes">
                <button
                  onClick={() => handleVote(q._id, q.userVote === 1 ? 0 : 1)}
                  className={`vote-btn upvote-btn ${q.userVote === 1 ? "upvoted" : ""}`}
                  disabled={!user || q.userVote === -1}
                >
                  ↑ {q.upvotes || 0}
                </button>
                <button
                  onClick={() => handleVote(q._id, q.userVote === -1 ? 0 : -1)}
                  className={`vote-btn downvote-btn ${q.userVote === -1 ? "downvoted" : ""}`}
                  disabled={!user || q.userVote === 1}
                >
                  ↓ {q.downvotes || 0}
                </button>
              </div>
              <div className="answer-count-bubble">{q.answers?.length || 0} Answers</div>
            </div>

            <div className="card-right-section">
              <div className="question-header">
                <span className="question-title clickable" onClick={() => navigate(`/questions/${q._id}`)}>
                  {q.title}
                </span>
                {user && q.author && user.id === q.author._id && (
                  <button className="delete-btn" onClick={() => handleDelete(q._id)}>Delete</button>
                )}
              </div>

              <div className="question-meta">
                <span>{"• " + new Date(q.createdAt).toLocaleDateString()}</span>
                <span>{"• Author: " + (q.author?.name || "Anonymous")}</span>
              </div>

              {q.tags && q.tags.length > 0 && (
                <div className="question-tags">
                  {q.tags.map((tag, idx) => <span key={idx} className="tag-badge">{tag}</span>)}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
