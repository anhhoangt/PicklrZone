import React, { useEffect, useState } from "react";
import { getUserProfile, updateUserProfile } from "../services/api";
import { UserProfile, UserRole } from "../types";
import { useAuth } from "../contexts/AuthContext";
import "./Profile.css";

const Profile: React.FC = () => {
  const { currentUser, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getUserProfile();
        setDisplayName(data.displayName || currentUser?.displayName || "");
        setRole(data.role || "user");
        setBio(data.bio || "");
        setLocation(data.location || "");
      } catch {
        setDisplayName(currentUser?.displayName || "");
      }
      setLoading(false);
    };
    load();
  }, [currentUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await updateUserProfile({
        displayName,
        role,
        bio,
        location,
        photoURL: currentUser?.photoURL || "",
      });
      setSuccess(true);
      await refreshProfile();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <span className="bounce-ball">🏓</span>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Welcome + Stats */}
      <div className="profile-welcome">
        <div className="profile-welcome-info">
          <div className="profile-welcome-avatar">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="avatar" />
            ) : (
              <div className="profile-avatar-placeholder">
                {displayName.charAt(0).toUpperCase() ||
                  currentUser?.email?.charAt(0).toUpperCase() ||
                  "?"}
              </div>
            )}
          </div>
          <div>
            <h1>Welcome, {displayName || currentUser?.email}!</h1>
            <p className="profile-email">{currentUser?.email}</p>
          </div>
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat-card">
          <span className="stat-icon">🏆</span>
          <span className="stat-value">0</span>
          <span className="stat-label">Matches Played</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📈</span>
          <span className="stat-value">—</span>
          <span className="stat-label">Skill Rating</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🔥</span>
          <span className="stat-value">0</span>
          <span className="stat-label">Win Streak</span>
        </div>
      </div>

      {/* Profile Form */}
      <h2 className="profile-section-title">My Profile</h2>

      {error && <div className="profile-error">{error}</div>}
      {success && <div className="profile-success">✅ Profile updated!</div>}

      <form onSubmit={handleSave} className="profile-form">
        <div className="profile-card">
          <div className="profile-form-grid">
            <label className="form-label">
              Display Name
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </label>

            <label className="form-label">
              Role
              <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                <option value="user">🎓 Student — I want to learn pickleball</option>
                <option value="vendor">🏆 Vendor — I want to sell courses</option>
              </select>
            </label>

            <label className="form-label">
              Location (City, State)
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Austin, TX"
              />
              <span className="form-helper">
                Used to match you with local instructors for in-person training
              </span>
            </label>
          </div>

          <label className="form-label">
            Bio
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about your pickleball journey..."
              rows={4}
            />
          </label>
        </div>

        <div className="profile-actions">
          <button type="submit" className="btn-app btn-app-filled" disabled={saving}>
            <span className="btn-ball">🏓</span>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
