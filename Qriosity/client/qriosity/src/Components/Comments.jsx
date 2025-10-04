import { useEffect, useState, useContext } from "react";
import { AuthContext } from "./AuthContext";
import axios from "axios";
import "./Comments.css";

export default function Comments({ parentId, parentType, className }) {
  const { user } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  // Get current user's vote
  const getUserVote = (userVotes) => {
    if (!user || !userVotes) return 0;
    const voteObj = userVotes.find(v => v.user?.toString() === user.id);
    return voteObj ? voteObj.vote : 0;
  };

  // Fetch comments
  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/comments/${parentId}`);
      setComments(res.data);
    } catch (err) {
      console.error("Failed to fetch comments:", err.response?.data || err.message);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (parentId) fetchComments();
  }, [parentId]);

  // Post comment
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user?.token) return alert("Login to post a comment");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/comments",
        { body: newComment, parentId, type: parentType },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setComments(prev => [...prev, res.data]);
      setNewComment("");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || "Failed to post comment");
    }
  };

  // Delete comment
  const handleDelete = async (commentId) => {
    // NOTE: Use a custom modal instead of window.confirm in a real app
    if (!window.confirm("Delete this comment?")) return; 
    try {
      await axios.delete(`http://localhost:5000/api/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setComments(prev => prev.filter(c => c._id !== commentId));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || "Failed to delete comment");
    }
  };

  // Vote comment
  const handleVoteComment = async (commentId, voteDirection) => {
    // voteDirection will be 1, -1, or 0
    if (!user?.token) return alert("Login to vote");

    try {
      const res = await axios.patch(
        `http://localhost:5000/api/comments/${commentId}/vote`,
        { vote: voteDirection }, // Sends 1, -1, or 0
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      // Update the local state with the new data from the server
      setComments(prev => prev.map(c => c._id === commentId ? res.data : c));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || "Failed to vote comment");
      fetchComments(); // Sync state on failure
    }
  };

  return (
    <div className={`comments-container ${className}`}>
      <h5 className="comments-heading">Comments</h5>

      {loading ? (
        <p className="comment-status-message">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="comment-status-message">No comments yet.</p>
      ) : (
        <ul className="comments-list">
          {comments.map(c => {
            const userVote = getUserVote(c.userVotes);
            return (
              <li key={c._id} className="comment-item">
                <div className="comment-body-section">
                  <span className="comment-author">{c.author?.name || "Anonymous"}:</span>{" "}
                  <span className="comment-body">{c.body}</span>
                </div>

                <div className="comment-actions">
                  {/* Upvote Button */}
                  <button
                    onClick={() => handleVoteComment(c._id, userVote === 1 ? 0 : 1)}
                    className={`vote-btn upvote-btn ${userVote === 1 ? "upvoted" : ""}`}
                    disabled={!user || userVote === -1} // Disable if already downvoted
                  >
                    <span className="vote-icon">&#x25B2;</span>
                    <span className="vote-text">{(c.userVotes || []).filter(v => v.vote === 1).length}</span>
                  </button>

                  {/* Downvote Button */}
                  <button
                    onClick={() => handleVoteComment(c._id, userVote === -1 ? 0 : -1)}
                    className={`vote-btn downvote-btn ${userVote === -1 ? "downvoted" : ""}`}
                    disabled={!user || userVote === 1} // Disable if already upvoted
                  >
                    <span className="vote-icon">&#x25BC;</span>
                    <span className="vote-text">{(c.userVotes || []).filter(v => v.vote === -1).length}</span>
                  </button>

                  {/* DELETE BUTTON (FIXED POSITION) */}
                  {user && c.author && user.id === c.author._id && (
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="comment-delete-btn"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {user ? (
        <form onSubmit={handleCommentSubmit} className="comment-form">
          <input
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            className="comment-input"
          />
          <button type="submit" className="submit-btn">Post</button>
        </form>
      ) : (
        <p className="comment-status-message">Please log in to post a comment.</p>
      )}
    </div>
  );
}
