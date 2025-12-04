// frontend/src/components/MessageFab.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "../api/axios";
import { io } from "socket.io-client";

export default function MessageFab({ user }) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);

  const socketRef = useRef(null);

  const loadNotifications = async () => {
    try {
      const res = await axios.get("/notifications/all");
      const list = res.data || [];
      setNotifs(list);
      setUnread(list.filter((n) => !n.is_read).length);
    } catch (err) {
      console.error("Load notifications error:", err);
    }
  };

  useEffect(() => {
    if (!user) return;

    loadNotifications();

    const socket = io("https://texteditorbackend-uxt9.onrender.com", {
      auth: { userId: user.id },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🔌 MessageFab socket connected", socket.id);
    });

    socket.on("notification:new", (notif) => {
      console.log("🔔 NEW notification received:", notif);
      setNotifs((prev) => [notif, ...prev]);
      if (!notif.is_read) setUnread((p) => p + 1);
    });

    return () => {
      socket.off("notification:new");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const openNotification = async (notif) => {
    try {
      await axios.put(`/notifications/read/${notif.id}`);

      setNotifs((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );

      if (!notif.is_read) setUnread((u) => Math.max(0, u - 1));

      window.dispatchEvent(
        new CustomEvent("openSharedFromNotification", {
          detail: notif.documentid,
        })
      );
    } catch (err) {
      console.error("Read notification error:", err);
    }
  };

  const clearAll = async () => {
    try {
      await axios.delete("/notifications/clear-all");
      setNotifs([]);
      setUnread(0);
    } catch (err) {
      console.error("Clear all error:", err);
    }
  };

  return (
    <>
      <button
        className="message-fab"
        onClick={() => setOpen((p) => !p)}
        title="Messages"
      >
        <span className="message-fab-icon">💬</span>
        {unread > 0 && <span className="message-fab-dot">{unread}</span>}
      </button>

      {open && (
        <div className="message-fab-panel">
          <div className="message-fab-header">
            Notifications
            {notifs.length > 0 && (
              <button className="message-clear-btn" onClick={clearAll}>
                Clear All
              </button>
            )}
          </div>

          <div className="message-fab-body">
            {notifs.length === 0 ? (
              <div className="message-fab-empty">No notifications yet.</div>
            ) : (
              notifs.map((n) => (
                <div key={n.id} className="message-fab-item">
                  <div className="message-fab-title">{n.message}</div>
                  <div className="message-fab-time">
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                  <button
                    className="message-fab-open-btn"
                    onClick={() => openNotification(n)}
                  >
                    Open
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
