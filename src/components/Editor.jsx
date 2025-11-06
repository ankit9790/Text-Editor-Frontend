import React, { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

export default function Editor({ socket, doc }) {
  const editorRef = useRef();
  const quillRef = useRef();

  useEffect(() => {
    if (quillRef.current) return; // prevent double init

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

    // ✅ Join doc room so backend sends content
    socket.emit("join-document", doc.id);
  }, []);

  useEffect(() => {
    if (!quillRef.current || !socket) return;
    const quill = quillRef.current;

    const handleTextChange = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("text-change", {
        docId: doc.id,
        content: quill.root.innerHTML,
      });
    };

    quill.on("text-change", handleTextChange);

    // ✅ Load existing content
    socket.on("load-document", (content) => {
      if (quill.root.innerHTML !== content) {
        quill.root.innerHTML = content;
      }
    });

    // ✅ Apply changes from others
    socket.on("receive-changes", (content) => {
      if (content !== quill.root.innerHTML) {
        quill.root.innerHTML = content;
      }
    });

    return () => {
      quill.off("text-change", handleTextChange);
      socket.off("receive-changes");
      socket.off("load-document"); // ✅ prevent duplication
    };
  }, [socket, doc.id]);

  useEffect(() => {
    if (!socket) return;
    const interval = setInterval(() => {
      if (quillRef.current)
        socket.emit("save-document", {
          docId: doc.id,
          content: quillRef.current.root.innerHTML,
        });
    }, 2000);
    return () => clearInterval(interval);
  }, [socket, doc.id]);

  return <div ref={editorRef} style={{ height: "500px" }} />;
}
