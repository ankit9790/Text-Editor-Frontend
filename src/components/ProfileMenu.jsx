import React, { useState, useRef, useEffect } from "react";

export default function ProfileMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const initial =
    user?.username?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "U";

  // Close popup when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="profile-wrapper" ref={menuRef}>
      {/* Avatar */}
      <button
        className="profile-avatar"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        {initial}
      </button>

      {open && (
        <div className="profile-popup">
          <div className="profile-popup-header">
            <div className="profile-popup-avatar">{initial}</div>

            <div className="profile-popup-info">
              <div className="profile-popup-email">{user?.email}</div>
              <div className="profile-popup-hi">
                Hi, {user?.username || "User"}!
              </div>
            </div>
          </div>

          <button
            className="profile-popup-btn profile-popup-primary"
            onClick={() => alert("Account Management Coming Soon")}
          >
            Manage your account
          </button>

          <div className="profile-popup-row">
            <button className="profile-popup-btn">Add account</button>

            {/* FIXED SIGN OUT BUTTON */}
            <button
              className="profile-popup-btn"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
            >
              Sign out
            </button>
          </div>

          <div className="profile-popup-footer">
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms</span>
          </div>
        </div>
      )}
    </div>
  );
}
