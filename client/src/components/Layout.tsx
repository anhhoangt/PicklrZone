import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import UpcomingEvents from "./UpcomingEvents";
import "./Layout.css";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, userRole, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="layout">
      {/* HEADER */}
      <header className="header">
        <Link to="/" className="header-brand">
          <span className="brand-icon">🏓</span>
          <span className="brand-name">PicklrZone</span>
        </Link>

        <div className="header-right">
          {/* Cart icon */}
          <Link to="/cart" className="header-cart">
            <span className="header-cart-icon">🛒</span>
            {itemCount > 0 && <span className="header-cart-badge">{itemCount}</span>}
          </Link>

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
            <Link
              to="/courses"
              className={`sidebar-link ${isActive("/courses") ? "sidebar-link-active" : ""}`}
            >
              <span className="sidebar-link-icon">📚</span>
              Courses
            </Link>

            <Link
              to="/cart"
              className={`sidebar-link ${isActive("/cart") ? "sidebar-link-active" : ""}`}
            >
              <span className="sidebar-link-icon">🛒</span>
              Cart
              {itemCount > 0 && <span className="sidebar-badge">{itemCount}</span>}
            </Link>

            {currentUser && (
              <>
                <Link
                  to="/my-learning"
                  className={`sidebar-link ${isActive("/my-learning") ? "sidebar-link-active" : ""}`}
                >
                  <span className="sidebar-link-icon">🎓</span>
                  My Learning
                </Link>

                <Link
                  to="/profile"
                  className={`sidebar-link ${isActive("/profile") ? "sidebar-link-active" : ""}`}
                >
                  <span className="sidebar-link-icon">👤</span>
                  My Profile
                </Link>

                {userRole === "vendor" && (
                  <Link
                    to="/vendor/dashboard"
                    className={`sidebar-link ${isActive("/vendor/dashboard") ? "sidebar-link-active" : ""}`}
                  >
                    <span className="sidebar-link-icon">🏪</span>
                    My Courses
                  </Link>
                )}
              </>
            )}

            <div className="sidebar-divider" />

            {!currentUser && (
              <div className="sidebar-cta">
                <p>Log in to access all features</p>
                <Link to="/login" className="btn-app btn-app-filled btn-sm sidebar-cta-btn">
                  <span className="btn-ball">🏓</span>
                  Get Started
                </Link>
              </div>
            )}
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="main-content">
          <UpcomingEvents />
          {children}
        </main>
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
