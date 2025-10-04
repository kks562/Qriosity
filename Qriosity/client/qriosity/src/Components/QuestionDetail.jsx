import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import axios from "axios";
import Comments from "./Comments";
import "./QuestionDetail.css";

export default function QuestionDetail() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newAnswer, setNewAnswer] = useState("");

  const getUserVote = (userVotes) => {
    if (!user || !userVotes) return 0;
    const voteObj = userVotes.find(v => v.user?.toString() === user.id);
    return voteObj ? voteObj.vote : 0;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/questions/${id}`);
      setQuestion(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  // Vote question
  const handleVoteQuestion = async (voteDirection) => {
    if (!user?.token) return alert("Login to vote");
    const newVote = getUserVote(question.userVotes) === voteDirection ? 0 : voteDirection;

    try {
      const res = await axios.patch(
        `http://localhost:5000/api/questions/${id}/vote`,
        { vote: newVote },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setQuestion(res.data);
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to vote");
    }
  };

  // Vote answer
  const handleVoteAnswer = async (answerId, voteDirection) => {
    if (!user?.token) return alert("Login to vote");

    try {
      const res = await axios.patch(
        // Ensure 'id' here is the Question ID from useParams()
        `http://localhost:5000/api/answers/${id}/${answerId}/vote`, 
        { vote: voteDirection }, // voteDirection will be 1, -1, or 0
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      // This updates the entire answers array using the data returned by the API
      setQuestion(prev => ({
        ...prev,
        answers: prev.answers.map(a => (a._id === answerId ? res.data : a))
      }));
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to vote answer");
      // You might want to re-fetch the question here to sync state if the API call fails.
    }
  };


  // Post answer
  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!newAnswer.trim()) return;
    if (!user?.token) return alert("Login to post an answer");

    try {
      const res = await axios.post(
        `http://localhost:5000/api/answers/${id}`,
        { body: newAnswer },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setQuestion(prev => ({ ...prev, answers: [...prev.answers, res.data] }));
      setNewAnswer("");
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to post answer");
    }
  };


  // Delete answer
  const handleDeleteAnswer = async (answerId) => {
    // NOTE: Use a custom modal instead of window.confirm in a real app
    if (!window.confirm("Delete this answer?")) return; 
    try {
      await axios.delete(
        `http://localhost:5000/api/answers/${id}/${answerId}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setQuestion(prev => ({
        ...prev,
        answers: prev.answers.filter(a => a._id !== answerId)
      }));
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to delete answer");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!question) return <p>No question found.</p>;

  const questionVote = getUserVote(question.userVotes);

  // QuestionDetail.js (Updated return statement)

  return (
    <div className="qd-container">
      <div className="qd-question-card">
        <div className="qd-main-content">
          <div className="qd-vote-panel">
            {/* PLACEHOLDER for Question Vote Buttons - Add them here if needed */}
          </div>

          <div className="qd-content-area">
            <h2 className="qd-title">{question.title}</h2>
            <div className="qd-body" dangerouslySetInnerHTML={{ __html: question.body }} />
          </div>
        </div>
        <Comments parentId={question._id} parentType="question" />
      </div>

      {/* Answers */}
      <div className="qd-answers-section">
        <h3>{question.answers?.length || 0} Answers</h3>
        {question.answers?.map(a => {
          const userVote = getUserVote(a.userVotes);
          return (
            // START of the clean, desired answer structure
            <div key={a._id} className="qd-answer-card">
              <div className="qd-answer-main-row"> {/* New wrapper for content and votes */}
                
                {/* 1. Answer Body (The content is now the main focus) */}
                <div className="qd-content-area">
                  <div className="qd-answer-body" dangerouslySetInnerHTML={{ __html: a.body }} />
                  <div className="qd-answer-footer">
                    <small>Answered by: {a.author?.name || "Anonymous"}</small>
                    {user && a.author && user.id === a.author._id && (
                      <button onClick={() => handleDeleteAnswer(a._id)} className="delete-btn">Delete</button>
                    )}
                  </div>
                </div>
                
                {/* 2. Sleek Vertical Vote Panel (Smaller, to the side) */}
                <div className="qd-vote-panel answer-vote-panel-small">
                  {/* Upvote Button */}
                  <button
                    onClick={() => handleVoteAnswer(a._id, userVote === 1 ? 0 : 1)}
                    className={`vote-btn upvote-btn ${userVote === 1 ? 'upvoted' : ''}`}
                    disabled={!user || userVote === -1}
                  >
                    <span className="vote-icon">&#x25B2;</span>
                    <span className="vote-count">{a.upvotes}</span>
                  </button>
                  
                  {/* Downvote Button */}
                  <button
                    onClick={() => handleVoteAnswer(a._id, userVote === -1 ? 0 : -1)}
                    className={`vote-btn downvote-btn ${userVote === -1 ? 'downvoted' : ''}`}
                    disabled={!user || userVote === 1}
                  >
                    <span className="vote-count">{a.downvotes}</span>
                    <span className="vote-icon">&#x25BC;</span>
                  </button>
                </div>

              </div>
              
              {/* Comments Section (Kept separate below the main answer content) */}
              <Comments parentId={a._id} parentType="answer" />
            </div>
            // END of the clean answer structure
          );
        })}
      </div>

      {/* Add Answer */}
      <div className="qd-add-answer-wrapper">
        {user ? (
          <form onSubmit={handleAnswerSubmit} className="qd-add-answer-form">
            <textarea
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="Write your answer..."
              required
            />
            <button type="submit">Post Your Answer</button>
          </form>
        ) : <p>Please log in to post an answer.</p>}
      </div>
    </div>
  );
}
