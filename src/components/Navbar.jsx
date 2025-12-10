import React from "react";
import ProfileMenu from "./ProfileMenu";

export default function Navbar({ user, onShareClick, onLogin }) {
  return (
    <nav className="navbar">
      <h3 className="navbar-title">Collaborative Editor</h3>

      <div className="navbar-right">
        <button className="share-navbar-btn" onClick={onShareClick}>
          Share
        </button>

        {!user ? (
          <button
            className="login-navbar-btn"
            onClick={onLogin}
            style={{ marginLeft: 10 }}
          >
            Login
          </button>
        ) : (
          <ProfileMenu
            user={user}
            onLogout={() =>
              window.dispatchEvent(new CustomEvent("logoutRequested"))
            }
          />
        )}
      </div>
    </nav>
  );
}
