// src/Components/Profile.js
import { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import API from "./axios"; // Centralized API instance
import "./Profile.css";

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser, updateUser } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/profile/${userId}`);
        setProfileData(res.data);
      } catch (err) {
        setError("Failed to load profile. User may not exist.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleAvatarUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert("Please select a file first.");

    const formData = new FormData();
    formData.append("avatar", selectedFile);
    setUploading(true);

    try {
      const res = await API.post("/profile/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newAvatar = res.data.filePath;

      // Update profile state
      setProfileData((prev) => ({
        ...prev,
        user: { ...prev.user, avatar: newAvatar },
      }));

      // Update navbar immediately
      if (currentUser.id === userId) updateUser({ avatar: newAvatar });

      alert("Avatar updated successfully!");
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to upload avatar.");
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  };

  if (loading) return <p className="profile-status">Loading profile...</p>;
  if (error) return <p className="profile-status error">{error}</p>;
  if (!profileData) return <p className="profile-status">No profile data.</p>;

  const { user, questionsCount, answersCount } = profileData;
  const avatarUrl = `http://localhost:5000/${user.avatar.replace(/\\/g, "/")}`;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <img src={avatarUrl} alt={`${user.name}'s avatar`} className="profile-avatar" />
        <div className="profile-info">
          <h1>{user.name}</h1>
          <p>{user.email}</p>
          <div className="profile-stats">
            <div className="stat-item">
              <strong>{user.reputation}</strong>
              <span>Reputation</span>
            </div>
            <div className="stat-item">
              <strong>{questionsCount}</strong>
              <span>Questions</span>
            </div>
            <div className="stat-item">
              <strong>{answersCount}</strong>
              <span>Answers</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-badges">
        <h3>Badges</h3>
        {user.badges && user.badges.length > 0 ? (
          <div className="badges-list">
            {user.badges.map((badge, idx) => (
              <span key={idx} className={`badge badge-${badge.toLowerCase()}`}>
                {badge}
              </span>
            ))}
          </div>
        ) : (
          <p>No badges earned yet.</p>
        )}
      </div>

      {currentUser && currentUser.id === userId && (
        <div className="avatar-upload-section">
          <h3>Update Your Avatar</h3>
          <form onSubmit={handleAvatarUpload} className="avatar-upload-form">
            <label htmlFor="avatar-upload" className="custom-file-label">
              {selectedFile ? selectedFile.name : "Choose File"}
            </label>
            <input
              type="file"
              id="avatar-upload"
              onChange={handleFileChange}
              accept="image/*"
            />
            <button type="submit" disabled={uploading || !selectedFile}>
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
