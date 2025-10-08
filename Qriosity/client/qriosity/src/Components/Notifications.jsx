// src/Components/Notifications.jsx
import { useEffect, useState, useContext, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import { formatDistanceToNow } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import "./Notifications.css";

export default function Notifications({ setUnreadCount }) {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inFlight, setInFlight] = useState(new Set()); // track in-flight notification ids
  const navigate = useNavigate();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      setUnreadCount?.(0);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      try {
        const res = await axios.get("http://localhost:5000/api/notifications", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (!mountedRef.current) return;
        setNotifications(res.data);
        const unread = res.data.filter(n => !n.read).length;
        setUnreadCount?.(unread);
      } catch (err) {
        console.error("Fetch notifications error:", err);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    fetch();
  }, [user, setUnreadCount]);

  // mark a single notification as read and optionally navigate
  const markAsRead = async (notif, link) => {
    if (!user) return;

    // prevent repeated in-flight requests for same id
    if (inFlight.has(notif._id)) {
      if (link) navigate(link);
      return;
    }

    setInFlight(prev => new Set(prev).add(notif._id));

    try {
      await axios.patch(
        `http://localhost:5000/api/notifications/${notif._id}/read`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      // update local list (keep notification in list)
      setNotifications(prev =>
        prev.map(n => (n._id === notif._id ? { ...n, read: true } : n))
      );

      const unread = notifications.filter(n => n._id !== notif._id && !n.read).length;
      setUnreadCount?.(unread);

      if (link) navigate(link);
    } catch (err) {
      console.error("Mark notification as read error:", err);
    } finally {
      setInFlight(prev => {
        const copy = new Set(prev);
        copy.delete(notif._id);
        return copy;
      });
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    try {
      await axios.patch("http://localhost:5000/api/notifications/mark-all-read", {}, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount?.(0);
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  };

  const constructMessage = (n) => {
    const senderName = <strong>{n.sender?.name || "Someone"}</strong>;
    const questionTitle = n.question?.title ? <em>"{n.question.title}"</em> : 'your post';

    switch (n.type) {
      case 'comment':
        return <>{senderName} commented on {questionTitle}.</>;
      case 'answer':
        return <>{senderName} answered {questionTitle}.</>;
      case 'upvote':
        return <>{senderName} upvoted {questionTitle}.</>;
      case 'accepted':
        return <>{senderName} accepted your answer on {questionTitle}.</>;
      default:
        return <>{senderName}: {n.message}</>;
    }
  };

  if (loading && user) return <div className="no-notifications">Loading...</div>;

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <span>Notifications</span>
        <button className="mark-all-btn" onClick={markAllRead}>Mark all read</button>
      </div>

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="no-notifications">You have no notifications.</div>
        ) : (
          notifications.map((n) => {
            // link to question if available, else null
            const link = n.question?._id ? `/questions/${n.question._id}` : null;

            return (
              <div
                key={n._id}
                className={`notification-item ${!n.read ? "unread" : "read"}`}
                onClick={() => markAsRead(n, link)}
                role="button"
                aria-disabled={inFlight.has(n._id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="notification-avatar">
                  {n.sender?.avatar ? (
                    <img src={`http://localhost:5000/${n.sender.avatar.replace(/\\/g, "/")}`} alt="sender avatar" />
                  ) : (
                    <div className="placeholder"><FontAwesomeIcon icon={faUser} /></div>
                  )}
                </div>

                <div className="notification-content">
                  <div className="notification-message">{constructMessage(n)}</div>
                  <div className="notification-time">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
