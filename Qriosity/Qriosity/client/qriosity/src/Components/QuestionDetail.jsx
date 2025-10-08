import { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import API from "./axios"; // Use the centralized API instance
import Comments from "./Comments";
import "./QuestionDetail.css";

export default function QuestionDetail() {
  const { id: questionId } = useParams();
  const { user } = useContext(AuthContext);

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newAnswer, setNewAnswer] = useState("");

  // --- Data Fetching ---
  const fetchQuestion = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/questions/${questionId}`);
      setQuestion(res.data);
    } catch (err) {
      console.error("Failed to fetch question:", err);
      setQuestion(null); // Set to null on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion();
  }, [questionId]);

  // --- Voting Logic (Corrected to match backend schema) ---
  const getUserVote = (item) => {
    if (!user || !item) return 0;
    const isUpvoted = item.upvoters?.includes(user.id);
    const isDownvoted = item.downvoters?.includes(user.id);
    if (isUpvoted) return 1;
    if (isDownvoted) return -1;
    return 0;
  };

  const handleVote = async (item, itemType, voteDirection) => {
    if (!user) return alert("Please log in to vote.");

    const currentVote = getUserVote(item);
    // If user clicks the same vote button again, it sends 0 to unvote. Otherwise, it sends the new direction.
    const newVoteAction = currentVote === voteDirection ? 0 : voteDirection;
    
    try {
      let res;
      if (itemType === 'question') {
        res = await API.patch(`/questions/${questionId}/vote`, { vote: newVoteAction });
        setQuestion(res.data); // Update the entire question state
      } else if (itemType === 'answer') {
        res = await API.patch(`/answers/${questionId}/${item._id}/vote`, { vote: newVoteAction });
        // Update just the specific answer within the question state
        setQuestion(prev => ({
          ...prev,
          answers: prev.answers.map(a => a._id === item._id ? res.data : a)
        }));
      }
    } catch (err) {
       alert(err.response?.data?.msg || `Failed to vote on the ${itemType}.`);
       fetchQuestion(); // Resync with backend on failure
    }
  };


  // --- Answer Management ---
  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!newAnswer.trim()) return;
    try {
      const res = await API.post(`/answers/${questionId}`, { body: newAnswer });
      setQuestion(prev => ({ ...prev, answers: [...prev.answers, res.data] }));
      setNewAnswer("");
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to post answer.");
    }
  };

  const handleDeleteAnswer = async (answerId) => {
    // Note: A custom modal is recommended over window.confirm in production apps.
    if (!window.confirm("Are you sure you want to delete this answer?")) return;
    try {
      await API.delete(`/answers/${questionId}/${answerId}`);
      setQuestion(prev => ({
        ...prev,
        answers: prev.answers.filter(a => a._id !== answerId),
      }));
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to delete answer.");
    }
  };

  const handleAcceptAnswer = async (answerId) => {
    if (!window.confirm("Accept this answer as the solution?")) return;
    try {
      const res = await API.patch(`/answers/${questionId}/${answerId}/accept`);
      setQuestion(res.data); // Backend returns the full updated question
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to accept answer.");
    }
  };


  // --- Render Logic ---
  if (loading) return <p className="status-message">Loading question...</p>;
  if (!question) return <p className="status-message error">Question not found.</p>;

  const isQuestionOwner = user && user.id === question.author?._id;
  const questionVoteStatus = getUserVote(question);

  return (
    <div className="qd-container">
      <div className="qd-question-card">
        <div className="qd-main-content">
          {/* Question Vote Panel */}
          <div className="qd-vote-panel">
             <button
                onClick={() => handleVote(question, 'question', 1)}
                className={`vote-btn upvote-btn ${questionVoteStatus === 1 ? "upvoted" : ""}`}
                disabled={!user || questionVoteStatus === -1}
              >
                ▲<span className="vote-count">{question.upvotes || 0}</span>
              </button>
              <span className="vote-score">{question.score}</span>
              <button
                onClick={() => handleVote(question, 'question', -1)}
                className={`vote-btn downvote-btn ${questionVoteStatus === -1 ? "downvoted" : ""}`}
                disabled={!user || questionVoteStatus === 1}
              >
                ▼<span className="vote-count">{question.downvotes || 0}</span>
              </button>
          </div>
          <div className="qd-content-area">
              <h2 className="qd-title">{question.title}</h2>
              <div className="qd-body" dangerouslySetInnerHTML={{ __html: question.body }} />
              <div className="qd-footer">
                <small>
                  Asked by: <Link to={`/profile/${question.author._id}`}>{question.author.name}</Link> on {new Date(question.createdAt).toLocaleDateString()}
                </small>
              </div>
          </div>
        </div>
        <Comments parentId={question._id} parentType="question" />
      </div>

      <div className="qd-answers-section">
        <h3>{question.answers?.length || 0} Answers</h3>
        {question.answers
          ?.sort((a, b) => (b._id === question.acceptedAnswer) - (a._id === question.acceptedAnswer))
          .map(answer => {
            const isAccepted = question.acceptedAnswer === answer._id;
            const answerVoteStatus = getUserVote(answer);

            return (
              <div key={answer._id} className={`qd-answer-card ${isAccepted ? 'accepted-answer' : ''}`}>
                <div className="qd-answer-main-row">
                  <div className="qd-vote-panel answer-vote-panel">
                     <button
                        onClick={() => handleVote(answer, 'answer', 1)}
                        className={`vote-btn upvote-btn ${answerVoteStatus === 1 ? "upvoted" : ""}`}
                        disabled={!user || answerVoteStatus === -1}
                      >
                       ▲<span className="vote-count">{answer.upvoters?.length || 0}</span>
                      </button>
                      <span className="vote-score">{answer.votes}</span>
                      <button
                        onClick={() => handleVote(answer, 'answer', -1)}
                        className={`vote-btn downvote-btn ${answerVoteStatus === -1 ? "downvoted" : ""}`}
                        disabled={!user || answerVoteStatus === 1}
                      >
                        ▼<span className="vote-count">{answer.downvoters?.length || 0}</span>
                      </button>
                  </div>
                  <div className="qd-content-area">
                    <div className="qd-answer-body" dangerouslySetInnerHTML={{ __html: answer.body }} />
                    <div className="qd-answer-footer">
                       <div>
                        {isQuestionOwner && !question.acceptedAnswer && (
                          <button onClick={() => handleAcceptAnswer(answer._id)} className="accept-btn">Accept Answer</button>
                        )}
                        {isAccepted && <div className="accepted-tick">✔ Accepted</div>}
                      </div>
                      <small>
                        Answered by: <Link to={`/profile/${answer.author._id}`}>{answer.author.name}</Link>
                        {user && user.id === answer.author._id && (
                          <button onClick={() => handleDeleteAnswer(answer._id)} className="delete-btn">Delete</button>
                        )}
                      </small>
                    </div>
                  </div>
                </div>
                <Comments parentId={answer._id} parentType="answer" />
              </div>
            );
          })}
      </div>

      {user ? (
        <form onSubmit={handleAnswerSubmit} className="qd-add-answer-form">
          <h3>Your Answer</h3>
          <textarea
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            placeholder="Write your answer..."
            required
          />
          <button type="submit">Post Your Answer</button>
        </form>
      ) : (
        <p className="login-prompt">Please <Link to="/login">log in</Link> to post an answer.</p>
      )}
    </div>
  );
}
