// src/pages/Dashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "../api/axios";
import Editor from "../components/Editor";

export default function Dashboard({ user }) {
  const [documents, setDocuments] = useState([]);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [showInline, setShowInline] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDocId, setNewDocId] = useState(""); // owner assigns docId
  const docsRef = useRef([]);

  // Fetch documents and setup join event
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

    const onJoin = (e) => {
      const rawId = e?.detail;
      if (!rawId) return;
      const id = String(rawId).trim();
      if (!id) return;

      // 1) Try find locally
      const found = docsRef.current.find(
        (d) => String(d.id) === id || String(d.docId) === id
      );
      if (found) {
        setCurrentDoc(found);
        return;
      }

      // 2) Try fetching by internal id
      (async () => {
        try {
          const res = await axios.get(`/documents/${id}`);
          const doc = res.data;
          if (doc && doc.id) {
            setCurrentDoc(doc);
            setDocuments((prev) =>
              prev.some((x) => x.id === doc.id) ? prev : [...prev, doc]
            );
            docsRef.current = [...docsRef.current, doc].filter(Boolean);
            return;
          }
        } catch (err) {
          // fallback to docId
        }

        // 3) Fetch by docId
        try {
          const res2 = await axios.get(`/documents/join/${id}`);
          const doc2 = res2.data;
          if (doc2 && doc2.id) {
            setCurrentDoc(doc2);
            setDocuments((prev) =>
              prev.some((x) => x.id === doc2.id) ? prev : [...prev, doc2]
            );
            docsRef.current = [...docsRef.current, doc2].filter(Boolean);
            return;
          } else {
            alert(
              (res2?.data?.error || "Document not found.") + " Check the ID!"
            );
          }
        } catch (err2) {
          const msg =
            err2?.response?.data?.error ||
            "Document not found or server error.";
          alert(msg);
        }
      })();
    };

    window.addEventListener("joinDocById", onJoin);
    return () => window.removeEventListener("joinDocById", onJoin);
  }, []);

  // Create document (owner assigns docId manually)
  const createDoc = async (title, docId) => {
    if (!title?.trim() || !docId?.trim()) {
      alert("Title and Document ID are required");
      return;
    }

    try {
      const res = await axios.post("/documents", {
        title,
        content: "",
        docId,
      });
      const newDoc = res.data;
      setDocuments((d) => [...d, newDoc]);
      docsRef.current = [...docsRef.current, newDoc];
      setShowInline(false);
      setNewTitle("");
      setNewDocId("");
      setCurrentDoc(newDoc);
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to create document");
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
            <div
              style={{
                marginTop: 8,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter file name"
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid #ccc",
                }}
              />
              <input
                value={newDocId}
                onChange={(e) => setNewDocId(e.target.value)}
                placeholder="Enter document ID (shareable)"
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid #ccc",
                }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => createDoc(newTitle.trim(), newDocId.trim())}
                  className="btn btn-create-small"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowInline(false);
                    setNewTitle("");
                    setNewDocId("");
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
                onClick={() => setCurrentDoc(doc)}
                style={{ cursor: "pointer" }}
              >
                {doc.title || "Untitled"} (ID: {doc.docId})
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
