// src/components/Editor.jsx
import React, { useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io } from "socket.io-client";
import axios from "../api/axios";
import { saveDocumentLocally } from "../utils/saveLocal";

// ---------- CUSTOM FONT & SIZE SETUP ----------
const Font = Quill.import("formats/font");

// REMOVE ALL DEFAULT QUILL FONTS
Font.whitelist = ["sans-serif", "serif", "monospace"];
Quill.register(Font, true);

const Size = Quill.import("attributors/style/size");

// REMOVE DEFAULT QUILL SIZES → ADD CUSTOM SIZES LIKE GOOGLE DOCS
Size.whitelist = [
  "6px",
  "8px",
  "10px",
  "11px",
  "13px",
  "14px",
  "16px",
  "18px",
  "24px",
  "32px",
];

Quill.register(Size, true);

export default function Editor({ doc }) {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const socketRef = useRef(null);
  const emitTimer = useRef(null);
  const saveTimer = useRef(null);
  const suppressNext = useRef(false);

  const [permission, setPermission] = useState("edit"); // "edit" | "view"

  // 🔹 Load permission from backend
  useEffect(() => {
    if (!doc) return;

    const fetchPermission = async () => {
      try {
        const res = await axios.get(`/share/permission/${doc.id}`);
        setPermission(res.data.permission); // "edit" | "view" | "none"
      } catch (err) {
        console.log("Permission load error", err);
      }
    };

    fetchPermission();
  }, [doc]);

  // 🔹 Initial Quill setup (with font + size dropdowns)
  useEffect(() => {
    if (!editorRef.current) return;

    if (!quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
        modules: {
          toolbar: [
            [{ font: Font.whitelist }, { size: Size.whitelist }],
            ["bold", "italic", "underline"],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ header: [1, 2, 3, false] }],
            [{ align: [] }],
            ["link", "image"],
          ],
        },
      });

      // default align left
      quillRef.current.format("align", "left");
    }
  }, []);

  // 🔹 Apply Permission Mode (Enable / Disable editing)
  useEffect(() => {
    if (!quillRef.current) return;

    const quill = quillRef.current;
    const rootEl = quill.root;
    const toolbar = rootEl.parentElement?.querySelector(".ql-toolbar");

    if (permission === "view" || permission === "none") {
      quill.disable();
      if (toolbar) toolbar.style.display = "none";
    } else {
      quill.enable();
      if (toolbar) toolbar.style.display = "block";
    }
  }, [permission]);

  // 🔹 Load document + Socket logic
  useEffect(() => {
    if (!doc || !quillRef.current) return;

    const quill = quillRef.current;

    // reset old socket
    if (socketRef.current) {
      try {
        socketRef.current.disconnect();
      } catch {}
      socketRef.current = null;
    }

    const socket = io("https://texteditorbackend-uxt9.onrender.com");
    socketRef.current = socket;

    socket.emit("join-document", doc.id);

    socket.on("load-document", (content) => {
      suppressNext.current = true;
      quill.clipboard.dangerouslyPasteHTML(content || "");
      quill.formatText(0, quill.getLength(), { align: "left" });
      quill.setSelection(quill.getLength(), 0);
      suppressNext.current = false;
    });

    socket.on("receive-changes", (content) => {
      // even view users should SEE changes from others
      suppressNext.current = true;
      quill.clipboard.dangerouslyPasteHTML(content || "");
      quill.formatText(0, quill.getLength(), { align: "left" });
      quill.setSelection(quill.getLength(), 0);
      suppressNext.current = false;
    });

    const onChange = () => {
      if (permission !== "edit") return; // only editors send and save
      if (suppressNext.current) return;

      const html = quill.root.innerHTML;

      // save to localStorage
      saveDocumentLocally(doc.id, html);

      // broadcast typing
      if (emitTimer.current) clearTimeout(emitTimer.current);
      emitTimer.current = setTimeout(() => {
        socket.emit("text-change", {
          roomId: doc.id,
          content: html,
        });
      }, 200);

      // autosave to server
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
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
  }, [doc, permission]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        ref={editorRef}
        style={{
          flex: 1,
          height: "100%",
          minHeight: 420,
          background: "#fff",
          borderRadius: 8,
        }}
      />
    </div>
  );
}
