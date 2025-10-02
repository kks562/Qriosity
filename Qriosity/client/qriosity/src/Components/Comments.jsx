import { useEffect, useState, useContext } from "react";
import { AuthContext } from "./AuthContext";
import axios from "axios";

export default function Comments({ parentId, parentType }) {
  const { user } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch comments for this parent (Question or Answer)
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

  // Post new comment
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!user?.token) {
      alert("You must log in to post a comment!");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/comments",
        { body: newComment, parentId, parentType },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setComments((prev) => [...prev, res.data]);
      setNewComment("");
    } catch (err) {
      console.error("Failed to post comment:", err.response?.data || err.message);
      alert(err.response?.data?.msg || "Failed to post comment");
    }
  };

  // Delete comment
  const handleDelete = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setComments((prev) => prev.filter(c => c._id !== commentId));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || "Failed to delete comment");
    }
  };

  useEffect(() => {
    if (parentId) fetchComments();
  }, [parentId]);

  return (
    <div className="comments-container">
      <h4>Comments</h4>

      {loading ? (
        <p>Loading comments...</p>
      ) : comments.length === 0 ? (
        <p>No comments yet.</p>
      ) : (
        <ul>
          {comments.map((c) => (
            <li key={c._id}>
              <strong>{c.authorId?.name || "Anonymous"}:</strong> {c.body}
              {user && user.id === c.authorId?._id && (
                <button onClick={() => handleDelete(c._id)} style={{ marginLeft: "10px" }}>
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {user ? (
        <form onSubmit={handleCommentSubmit} style={{ marginTop: "10px" }}>
          <input
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            style={{ width: "70%", marginRight: "5px" }}
          />
          <button type="submit">Post Comment</button>
        </form>
      ) : (
        <p>Please log in to post a comment.</p>
      )}
    </div>
  );
}
