// src/components/Editor.jsx
import React, { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io } from "socket.io-client";
import axios from "../api/axios";

export default function Editor({ doc }) {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const socketRef = useRef(null);
  const emitTimer = useRef(null);
  const saveTimer = useRef(null);
  const suppressNext = useRef(false);

  useEffect(() => {
    if (!editorRef.current) return;
    if (!quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
        modules: {
          toolbar: [
            ["bold", "italic", "underline"],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ header: [1, 2, 3, false] }],
            [{ align: [] }],
            ["link", "image"],
          ],
        },
      });
      quillRef.current.root.setAttribute("dir", "ltr");
    }
  }, []);

  useEffect(() => {
    if (!doc || !quillRef.current) return;
    const quill = quillRef.current;

    if (socketRef.current) {
      try {
        socketRef.current.disconnect();
      } catch {}
      socketRef.current = null;
    }

    // Determine socket host from environment variable or fallback
    const API_HOST = import.meta.env.VITE_API_URL || "http://localhost:3000";

    // Connect to Socket.IO on Render. Use transports websocket (prefer) and allow reconnection
    const socket = io(API_HOST, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      secure: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      timeout: 20000,
      // extraHeaders sometimes required on certain proxies, but not in browsers
    });

    socketRef.current = socket;

    // Join using internal numeric id (this is critical)
    socket.emit("join-document", doc.id);

    // Load initial content sent from server
    socket.on("load-document", (content) => {
      if (content == null) content = "";
      if (quill.root.innerHTML !== content) {
        suppressNext.current = true;
        quill.clipboard.dangerouslyPasteHTML(content);
        quill.setSelection(quill.getLength(), 0);
        suppressNext.current = false;
      }
    });

    // Receive live changes from others
    socket.on("receive-changes", (content) => {
      if (content == null) content = "";
      if (quill.root.innerHTML !== content) {
        suppressNext.current = true;
        quill.clipboard.dangerouslyPasteHTML(content);
        quill.setSelection(quill.getLength(), 0);
        suppressNext.current = false;
      }
    });

    const onChange = () => {
      if (suppressNext.current) return;
      const html = quill.root.innerHTML;

      // Debounced broadcast to prevent flood
      if (emitTimer.current) clearTimeout(emitTimer.current);
      emitTimer.current = setTimeout(() => {
        // IMPORTANT: emit using roomId (internal id) so server broadcasts to correct room
        socket.emit("text-change", { roomId: doc.id, content: html });
      }, 180);

      // Debounced HTTP save for persistence
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await axios.put(`/documents/${doc.id}`, { content: html });
        } catch (err) {
          // ignore save errors — optionally show UI indicator
        }
      }, 1500);
    };

    quill.on("text-change", onChange);

    return () => {
      quill.off("text-change", onChange);
      if (emitTimer.current) clearTimeout(emitTimer.current);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      socket.off("load-document");
      socket.off("receive-changes");
      try {
        socket.disconnect();
      } catch {}
      socketRef.current = null;
    };
  }, [doc]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        ref={editorRef}
        style={{
          height: "100%",
          minHeight: 420,
          background: "#fff",
          borderRadius: 8,
        }}
      />
    </div>
  );
}
