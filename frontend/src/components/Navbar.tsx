import React from "react";
import { useAuthStore } from "../store/authStore";
import { disconnectSocket } from "../services/socket";
import { useNavigate } from "react-router-dom";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <span className="logo-icon">🚨</span>
        <span className="logo-text">Incident Map</span>
      </div>

      {user && (
        <div className="navbar-user">
          <span className="user-email">{user.email}</span>
          <span className={`badge ${user.role === "admin" ? "badge-admin" : "badge-user"}`}>
            {user.role}
          </span>
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </header>
  );
};
