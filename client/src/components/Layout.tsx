import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Layout.css";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="layout">
      {/* HEADER */}
      <header className="header">
        <Link to="/" className="header-brand">
          <span className="brand-icon">🏓</span>
          <span className="brand-name">PicklrZone</span>
        </Link>

        <div className="header-right">
          {currentUser ? (
            <div className="header-user">
              <div className="header-avatar">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="avatar" />
                ) : (
                  <span>
                    {currentUser.displayName?.charAt(0).toUpperCase() ||
                      currentUser.email?.charAt(0).toUpperCase() ||
                      "?"}
                  </span>
                )}
              </div>
              <span className="header-username">
                {currentUser.displayName || currentUser.email}
              </span>
              <button onClick={handleLogout} className="btn-app btn-app-outline">
                <span className="btn-ball">🏓</span>
                Log Out
              </button>
            </div>
          ) : (
            <div className="header-auth-buttons">
              <Link to="/login" className="btn-app btn-app-outline">
                <span className="btn-ball">🏓</span>
                Log In
              </Link>
              <Link to="/signup" className="btn-app btn-app-filled">
                <span className="btn-ball">🏓</span>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </header>

      <div className="layout-body">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <nav className="sidebar-nav">
            {/* No tabs yet — placeholder */}
            <div className="sidebar-empty">
              <span className="sidebar-empty-icon">🏓</span>
              <p>Coming soon</p>
            </div>
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="main-content">{children}</main>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <span>© 2026 PicklrZone</span>
        <span className="footer-tagline">Play hard. Dink smart.</span>
      </footer>
    </div>
  );
};

export default Layout;
