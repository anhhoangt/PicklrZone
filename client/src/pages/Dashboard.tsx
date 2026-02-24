import React from "react";
import { useAuth } from "../contexts/AuthContext";
import "./Dashboard.css";

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div className="dashboard">
      <div className="welcome-card">
        <div className="welcome-avatar">
          {currentUser?.photoURL ? (
            <img src={currentUser.photoURL} alt="avatar" />
          ) : (
            <div className="welcome-avatar-placeholder">
              {currentUser?.displayName?.charAt(0).toUpperCase() ||
                currentUser?.email?.charAt(0).toUpperCase() ||
                "?"}
            </div>
          )}
        </div>
        <div className="welcome-text">
          <h2>Welcome back, {currentUser?.displayName || "Player"}!</h2>
          <p>{currentUser?.email}</p>
        </div>
      </div>

      <div className="dashboard-grid">
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
    </div>
  );
};

export default Dashboard;
