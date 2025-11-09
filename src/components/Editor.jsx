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

    const socket = io("http://localhost:3000");
    socketRef.current = socket;

    // ✅ Join room using internal numeric ID (NOT docId)
    socket.emit("join-document", doc.id);

    socket.on("load-document", (content) => {
      if (content == null) content = "";
      if (quill.root.innerHTML !== content) {
        suppressNext.current = true;
        quill.clipboard.dangerouslyPasteHTML(content);
        quill.setSelection(quill.getLength(), 0);
        suppressNext.current = false;
      }
    });

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

      if (emitTimer.current) clearTimeout(emitTimer.current);
      emitTimer.current = setTimeout(() => {
        // ✅ Emit using internal ID so all users in room receive updates
        socket.emit("text-change", { roomId: doc.id, content: html });
      }, 180);

      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          // Save using internal ID
          await axios.put(`/documents/${doc.id}`, { content: html });
        } catch {}
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
