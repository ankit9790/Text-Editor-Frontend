// src/pages/Dashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "../api/axios";
import Editor from "../components/Editor";

export default function Dashboard({ user }) {
  const [documents, setDocuments] = useState([]);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [showInline, setShowInline] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const docsRef = useRef([]);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await axios.get("/documents");
        const docs = res.data || [];
        setDocuments(docs);
        docsRef.current = docs;
      } catch (err) {
        console.error("Failed to fetch documents:", err);
      }
    };
    fetchDocs();

    // robust join handler
    const onJoin = (e) => {
      const rawId = e?.detail;
      if (!rawId) return;
      const id = String(rawId).trim();
      if (!id) return;

      // 1) try find locally
      const found = docsRef.current.find((d) => String(d.id) === id);
      if (found) {
        setCurrentDoc(found);
        return;
      }

      // 2) try fetching from primary endpoint /documents/:id
      (async () => {
        try {
          let res = await axios.get(`/documents/${id}`);
          let doc = res.data;
          if (doc && doc.document) doc = doc.document;
          if (doc && doc.id) {
            setCurrentDoc(doc);
            setDocuments((prev) =>
              prev.some((x) => x.id === doc.id) ? prev : [...prev, doc]
            );
            docsRef.current = [...docsRef.current, doc].filter(Boolean);
            return;
          }
        } catch (err) {
          const status = err?.response?.status;
          if (status === 401 || status === 403) {
            alert(
              "Access denied. You are not authorized to open this document."
            );
            return;
          }
        }

        // 3) fallback: try /documents/join/:id
        try {
          const res2 = await axios.get(`/documents/join/${id}`);
          let doc2 = res2.data;
          if (doc2 && doc2.document) doc2 = doc2.document;
          if (doc2 && doc2.id) {
            setCurrentDoc(doc2);
            setDocuments((prev) =>
              prev.some((x) => x.id === doc2.id) ? prev : [...prev, doc2]
            );
            docsRef.current = [...docsRef.current, doc2].filter(Boolean);
            return;
          } else if (res2.data && typeof res2.data === "object") {
            const candidate = res2.data.document || res2.data;
            if (candidate && candidate.id) {
              setCurrentDoc(candidate);
              setDocuments((prev) =>
                prev.some((x) => x.id === candidate.id)
                  ? prev
                  : [...prev, candidate]
              );
              docsRef.current = [...docsRef.current, candidate].filter(Boolean);
              return;
            }
          }
          alert("Document not found.");
        } catch (err2) {
          const status2 = err2?.response?.status;
          if (status2 === 401 || status2 === 403) {
            alert(
              "Access denied. You are not authorized to open this document."
            );
          } else {
            alert("Document not found or server error.");
          }
        }
      })();
    };

    window.addEventListener("joinDocById", onJoin);
    return () => window.removeEventListener("joinDocById", onJoin);
  }, []);

  const createDoc = async (title) => {
    if (!title?.trim()) return;
    try {
      const res = await axios.post("/documents", { title, content: "" });
      const newDoc = res.data;
      setDocuments((d) => [...d, newDoc]);
      docsRef.current = [...docsRef.current, newDoc];
      setShowInline(false);
      setNewTitle("");
      setCurrentDoc(newDoc);
    } catch (err) {
      alert("Failed to create document");
    }
  };

  const deleteDoc = async (id) => {
    try {
      await axios.delete(`/documents/${id}`);
      setDocuments((d) => d.filter((x) => x.id !== id));
      docsRef.current = docsRef.current.filter((x) => x.id !== id);
      if (currentDoc?.id === id) setCurrentDoc(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard">
      <aside className="doc-list">
        {/* --- CURRENT USER EMAIL ADDED --- */}
        {user?.email && (
          <div className="current-user" style={{ marginBottom: 12 }}>
            Logged in as: <strong>{user.email}</strong>
          </div>
        )}

        <h3>Your Documents</h3>

        <div style={{ marginBottom: 8 }}>
          <button
            onClick={() => setShowInline((s) => !s)}
            className="btn btn-create"
          >
            + New File
          </button>

          {showInline && (
            <div style={{ marginTop: 8 }}>
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") createDoc(newTitle.trim());
                  if (e.key === "Escape") {
                    setShowInline(false);
                    setNewTitle("");
                  }
                }}
                placeholder="Enter file name"
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid #ccc",
                }}
              />
              <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                <button
                  onClick={() => createDoc(newTitle.trim())}
                  className="btn btn-create-small"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowInline(false);
                    setNewTitle("");
                  }}
                  className="btn btn-cancel-small"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          {documents.map((doc) => (
            <div key={doc.id} className="doc-item">
              <span
                onClick={() => {
                  setCurrentDoc(doc);
                }}
                style={{ cursor: "pointer" }}
              >
                {doc.title || "Untitled"}
              </span>
              <button onClick={() => deleteDoc(doc.id)}>Delete</button>
            </div>
          ))}
        </div>
      </aside>

      <main className="editor-area">
        <div className="editor-container">
          {currentDoc ? (
            <Editor doc={currentDoc} />
          ) : (
            <div className="editor-placeholder">
              Select or create a document to start editing
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
