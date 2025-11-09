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

  // Initialize Quill once
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

  // Main effect: runs whenever `doc` changes
  useEffect(() => {
    if (!doc || !quillRef.current) return;
    const quill = quillRef.current;

    // clean up existing socket if present
    if (socketRef.current) {
      try {
        socketRef.current.disconnect();
      } catch {}
      socketRef.current = null;
    }

    // Pick API host from env (auto-switch between dev/prod)
    const API_HOST = import.meta.env.VITE_API_URL || "http://localhost:3000";

    // Connect Socket.IO. Use the API host so deployed frontend talks to Render backend.
    const socket = io(API_HOST, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      secure: API_HOST.startsWith("https"),
      reconnection: true,
      reconnectionAttempts: Infinity,
      timeout: 20000,
    });
    socketRef.current = socket;

    // Join using internal numeric id (this is important)
    socket.emit("join-document", doc.id);

    // Initial load — server sends the current content
    socket.on("load-document", (content) => {
      if (content == null) content = "";
      if (quill.root.innerHTML !== content) {
        suppressNext.current = true;
        quill.clipboard.dangerouslyPasteHTML(content);
        quill.setSelection(quill.getLength(), 0);
        suppressNext.current = false;
      }
    });

    // Receive live changes from other clients
    socket.on("receive-changes", (content) => {
      if (content == null) content = "";
      if (quill.root.innerHTML !== content) {
        suppressNext.current = true;
        quill.clipboard.dangerouslyPasteHTML(content);
        quill.setSelection(quill.getLength(), 0);
        suppressNext.current = false;
      }
    });

    // When the Quill editor content changes locally
    const onChange = () => {
      if (suppressNext.current) return;
      const html = quill.root.innerHTML;

      // Debounced broadcast to reduce network chatter
      if (emitTimer.current) clearTimeout(emitTimer.current);
      emitTimer.current = setTimeout(() => {
        // Emit using roomId (internal id) so the server broadcasts to the correct room
        socket.emit("text-change", { roomId: doc.id, content: html });
      }, 180);

      // Debounced save to backend using HTTP PUT
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await axios.put(`/documents/${doc.id}`, { content: html });
        } catch (err) {
          // ignore save errors; optionally show UI
        }
      }, 1500);
    };

    quill.on("text-change", onChange);

    // Cleanup on unmount or doc change
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
