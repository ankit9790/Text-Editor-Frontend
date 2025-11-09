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

  // Initialize Quill only once
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

  // Run whenever `doc` changes (open a different document)
  useEffect(() => {
    if (!doc || !quillRef.current) return;
    const quill = quillRef.current;

    // Cleanup old socket (if any)
    if (socketRef.current) {
      try {
        socketRef.current.disconnect();
      } catch {}
      socketRef.current = null;
    }

    // Determine API & Socket hosts from env
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
    // Prefer a specific Socket URL env variable, otherwise use API host
    const SOCKET_BASE = import.meta.env.VITE_SOCKET_URL || API_BASE;

    // Connect to Socket.IO server (auto-switches between wss/http based on env)
    const socket = io(SOCKET_BASE, {
      path: "/socket.io",
      // try websocket first, fallback to polling for better compatibility
      transports: ["websocket", "polling"],
      secure: SOCKET_BASE.startsWith("https") || SOCKET_BASE.startsWith("wss"),
      reconnection: true,
      reconnectionAttempts: Infinity,
      timeout: 20000,
    });

    socketRef.current = socket;

    // Join the room by internal numeric id (crucial!)
    socket.emit("join-document", doc.id);

    // Server will emit the current content to this socket only
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

    // Local change handler
    const onChange = () => {
      if (suppressNext.current) return;
      const html = quill.root.innerHTML;

      // Debounced broadcast to room
      if (emitTimer.current) clearTimeout(emitTimer.current);
      emitTimer.current = setTimeout(() => {
        // Emit roomId (internal id) so server broadcasts to the correct room
        socket.emit("text-change", { roomId: doc.id, content: html });
      }, 180);

      // Debounced save via HTTP
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await axios.put(`/documents/${doc.id}`, { content: html });
        } catch (err) {
          // ignore save errors for now
        }
      }, 1500);
    };

    quill.on("text-change", onChange);

    // Cleanup on unmount/doc change
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
