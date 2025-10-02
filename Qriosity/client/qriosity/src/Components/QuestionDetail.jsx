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

  useEffect(() => {
    fetchData();
  }, [id]);

  // Post new answer
  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!newAnswer.trim()) return;
    if (!user?.token) return alert("You must log in to post an answer!");

    try {
      await axios.post(
        `http://localhost:5000/api/questions/${id}/answer`,
        { body: newAnswer },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setNewAnswer("");
      fetchData();
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to post answer");
    }
  };

  // Delete answer
  const handleDeleteAnswer = async (answerId) => {
    if (!window.confirm("Delete this answer?")) return;
    try {
      await axios.delete(
        `http://localhost:5000/api/answers/${id}/${answerId}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      fetchData();
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to delete answer");
    }
  };

  // Vote on answer
  const handleVoteAnswer = async (answerId, vote) => {
    if (!user?.token) return alert("Login to vote");
    try {
      await axios.patch(
        `http://localhost:5000/api/answers/${id}/${answerId}/vote`,
        { vote },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      fetchData();
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to vote");
    }
  };

  // Vote question
  const handleVoteQuestion = async (vote) => {
    if (!user?.token) return alert("Login to vote");
    try {
      await axios.patch(
        `http://localhost:5000/api/questions/${id}/vote`,
        { vote },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      fetchData();
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to vote");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!question) return <p>No question found.</p>;

  return (
    <div className="qd-container">
      <div className="qd-card">
        <h2 className="qd-title">{question.title}</h2>
        <div className="qd-body" dangerouslySetInnerHTML={{ __html: question.body }} />

        <div className="question-votes">
          <button onClick={() => handleVoteQuestion(1)}>👍 {question.upvotes || 0}</button>
          <button onClick={() => handleVoteQuestion(-1)}>👎</button>
        </div>

        <Comments parentId={question._id} parentType="Question" />
      </div>

      <div className="qd-answers-section">
        <h3>Answers</h3>
        {question.answers?.length ? (
          question.answers.map((a) => (
            <div key={a._id} className="qd-answer-card">
              <div dangerouslySetInnerHTML={{ __html: a.body }} />
              <small>{a.author?.name || "Anonymous"}</small>

              <div className="qd-answer-actions">
                <button onClick={() => handleVoteAnswer(a._id, 1)}>👍 {a.votes || 0}</button>
                <button onClick={() => handleVoteAnswer(a._id, -1)}>👎</button>

                {user && a.author && user.id === a.author._id && (
                  <button onClick={() => handleDeleteAnswer(a._id)}>Delete Answer</button>
                )}
              </div>

              <Comments parentId={a._id} parentType="Answer" />
            </div>
          ))
        ) : (
          <p>No answers yet.</p>
        )}

        {user && (
          <form onSubmit={handleAnswerSubmit} className="qd-add-answer-form">
            <textarea
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="Write your answer..."
              required
            />
            <button type="submit">Post Answer</button>
          </form>
        )}

        {!user && <p>Please log in to post an answer.</p>}
      </div>
    </div>
  );
}
