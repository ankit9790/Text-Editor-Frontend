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

  // init Quill once
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

  // handle doc changes / socket lifecycle
  useEffect(() => {
    if (!doc || !quillRef.current) return;
    const quill = quillRef.current;

    // disconnect old socket if any
    if (socketRef.current) {
      try {
        socketRef.current.disconnect();
      } catch {}
      socketRef.current = null;
    }

    const socket = io("http://localhost:3000");
    socketRef.current = socket;

    // join room
    socket.emit("join-document", doc.id);

    // request document load - server may emit load-document
    socket.on("load-document", (content) => {
      if (content == null) content = "";
      // only apply when different
      if (quill.root.innerHTML !== content) {
        // prevent triggering text-change handler as 'user'
        suppressNext.current = true;
        quill.clipboard.dangerouslyPasteHTML(content);
        // restore selection to end
        const length = quill.getLength();
        quill.setSelection(length, 0);
        suppressNext.current = false;
      }
    });

    socket.on("receive-changes", (content) => {
      if (content == null) content = "";
      if (quill.root.innerHTML !== content) {
        suppressNext.current = true;
        quill.clipboard.dangerouslyPasteHTML(content);
        const length = quill.getLength();
        quill.setSelection(length, 0);
        suppressNext.current = false;
      }
    });

    // handle local edits
    const onChange = () => {
      if (suppressNext.current) return;
      const html = quill.root.innerHTML;

      // debounce emit to avoid flooding and reduce flicker
      if (emitTimer.current) clearTimeout(emitTimer.current);
      emitTimer.current = setTimeout(() => {
        socket.emit("text-change", { docId: doc.id, content: html });
      }, 180);

      // save document (debounced)
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await axios.put(`/documents/${doc.id}`, { content: html });
        } catch (err) {
          // ignore save error
        }
      }, 1500);
    };

    quill.on("text-change", onChange);

    // cleanup on unmount or doc change
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
