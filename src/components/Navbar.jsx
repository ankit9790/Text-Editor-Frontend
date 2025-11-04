import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light px-4">
      <Link className="navbar-brand" to="/">
        Text Editor
      </Link>
      <div className="ms-auto">
        {!token ? (
          <>
            <Link to="/login" className="btn-login me-2">
              Login
            </Link>
            <Link to="/register" className="btn-register">
              Register
            </Link>
          </>
        ) : (
          <button className="btn btn-outline-danger" onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
