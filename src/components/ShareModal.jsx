

// src/components/ShareModal.jsx
import React, { useEffect, useState } from "react";
import axios from "../api/axios";

export default function ShareModal({ doc, onClose }) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("view");
  const [loading, setLoading] = useState(false);
  const [sharedWith, setSharedWith] = useState([]);

  useEffect(() => {
    const loadShares = async () => {
      try {
        const res = await axios.get(`/share/doc/${doc.id}/shares`);
        setSharedWith(res.data || []);
      } catch (err) {
        console.error("load shares error:", err);
      }
    };
    loadShares();
  }, [doc.id]);

  const handleShare = async () => {
    if (!email.trim()) {
      alert("Enter email");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/share/share", {
        docId: doc.id,
        email,
        permission,
      });

      // reload list
      const res = await axios.get(`/share/doc/${doc.id}/shares`);
      setSharedWith(res.data || []);

      setEmail("");
      setPermission("view");
    } catch (err) {
      alert(err.response?.data?.error || "Share failed");
    }
    setLoading(false);
  };

  const handleUnshare = async (userId) => {
    if (!window.confirm("Stop sharing with this user?")) return;

    try {
      await axios.delete(`/share/doc/${doc.id}/user/${userId}`);
      setSharedWith((list) => list.filter((u) => u.user_id !== userId));
    } catch (err) {
      alert(err.response?.data?.error || "Unshare failed");
    }
  };

  return (
    <div className="modal-bg">
      <div className="modal-box">
        <h3>Share: {doc.title || "Untitled"}</h3>

        <label style={{ marginTop: 10 }}>User Email</label>
        <input
          type="email"
          placeholder="Enter email…"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: 8,
            marginTop: 5,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />

        <label style={{ marginTop: 10 }}>Permission</label>
        <select
          value={permission}
          onChange={(e) => setPermission(e.target.value)}
          style={{
            width: "100%",
            padding: 8,
            marginTop: 5,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        >
          <option value="view">View only</option>
          <option value="edit">Can edit</option>
        </select>

        <div className="share-modal-actions">
          <button className="btn btn-cancel-small" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-create-small"
            disabled={loading}
            onClick={handleShare}
          >
            {loading ? "Sharing..." : "Share" }
          </button>
        </div>

        <hr style={{ margin: "16px 0" }} />

        <h4>Shared with</h4>
        {sharedWith.length === 0 && (
          <p style={{ fontSize: 13, color: "#555" }}>
            Not shared with anyone yet.
          </p>
        )}

        {sharedWith.map((u) => (
          <div key={u.id} className="shared-row">
            <div>
              <div className="shared-email">{u.email}</div>
              <div className="shared-perm">
                Permission: {u.permission}
              </div>
            </div>
            <button
              className="btn btn-cancel-small"
              onClick={() => handleUnshare(u.user_id)}
            >
              Unshare
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

