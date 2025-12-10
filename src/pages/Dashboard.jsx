import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import Editor from "../components/Editor";
import ShareModal from "../components/ShareModal";

export default function Dashboard({ user }) {
  const [myDocs, setMyDocs] = useState([]);
  const [currentDoc, setCurrentDoc] = useState(null);

  const [showMenuFor, setShowMenuFor] = useState(null);
  const [showShareModal, setShowShareModal] = useState(null);

  const [renameDoc, setRenameDoc] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  // Load documents only if logged in
  useEffect(() => {
    if (user) loadDocs();
    else setMyDocs([]); // logged-out user → no API docs
  }, [user]);

  const loadDocs = async () => {
    try {
      const res = await axios.get("/documents");
      setMyDocs(res.data || []);
    } catch (err) {
      console.error("Load docs error:", err);
    }
  };

  // Navbar "Share" button listener
  useEffect(() => {
    const handleOpenShare = () => {
      if (!user) return alert("Login required to share documents.");
      if (!currentDoc) return alert("Open a document first.");

      setShowShareModal({ doc: currentDoc });
    };

    window.addEventListener("openShareForCurrentDoc", handleOpenShare);
    return () =>
      window.removeEventListener("openShareForCurrentDoc", handleOpenShare);
  }, [currentDoc, user]);

  // 🔥 OPEN DOC FROM NOTIFICATION
  useEffect(() => {
    const handleOpenFromNotif = async (e) => {
      if (!user) return alert("Login required.");
      const docId = e.detail;
      if (!docId) return;

      try {
        const ownedRes = await axios.get("/documents");
        const owned = ownedRes.data || [];

        const sharedRes = await axios.get("/share/shared-with-me");
        const shared = sharedRes.data || [];

        const allDocs = [...owned, ...shared];
        setMyDocs(allDocs);

        const found = allDocs.find((d) => d.id === docId);
        if (found) setCurrentDoc(found);
        else alert("Document not found.");
      } catch (err) {
        console.error("Notification open error:", err);
      }
    };

    window.addEventListener("openSharedFromNotification", handleOpenFromNotif);

    return () =>
      window.removeEventListener(
        "openSharedFromNotification",
        handleOpenFromNotif
      );
  }, [user]);

  // ➤ Create new doc
  const createUntitledDoc = async () => {
    if (!user) return alert("Login required to create documents.");

    try {
      const res = await axios.post("/documents", {
        title: "Untitled document",
        content: "",
      });

      const newDoc = res.data;
      setMyDocs((prev) => [newDoc, ...prev]);
      setCurrentDoc(newDoc);
    } catch (err) {
      alert(err.response?.data?.error || "Create failed");
    }
  };

  // ➤ Delete document
  const deleteDoc = async (id) => {
    if (!user) return alert("Login required.");
    if (!window.confirm("Delete this file?")) return;

    try {
      await axios.delete(`/documents/${id}`);
      setMyDocs((p) => p.filter((d) => d.id !== id));
      if (currentDoc?.id === id) setCurrentDoc(null);
    } catch (err) {
      alert("Delete failed");
    }
  };

  // ➤ Save rename
  const saveRename = async () => {
    if (!user) return alert("Login required.");

    try {
      const res = await axios.put(`/documents/${renameDoc.id}`, {
        title: renameValue,
      });

      setMyDocs((p) => p.map((d) => (d.id === renameDoc.id ? res.data : d)));

      if (currentDoc?.id === renameDoc.id) setCurrentDoc(res.data);

      setRenameDoc(null);
      setRenameValue("");
    } catch (err) {
      alert("Rename failed");
    }
  };

  // 🔹 Save manually to server
  const saveDocument = async (docId) => {
    if (!user) return alert("Login required.");

    try {
      const content = localStorage.getItem(`doc_${docId}`) || "";
      await axios.put(`/documents/${docId}`, { content });
      alert("Document saved!");
    } catch (err) {
      alert("Failed to save");
      console.log(err);
    }
  };

  // 🔹 Save As → Download HTML file
  const saveAsDocument = (docId, title) => {
    const content = localStorage.getItem(`doc_${docId}`) || "";
    const filename = `${title || "document"}.html`;

    const blob = new Blob([content], { type: "text/html" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="dashboard">
      {/* SIDEBAR */}
      <aside className="doc-list">
        <div className="doc-tabs-header">
          <span>Document tabs</span>

          <button
            className="doc-tabs-add-btn"
            onClick={createUntitledDoc}
            title="Create new document"
          >
            +
          </button>
        </div>

        {!user && (
          <div style={{ padding: 10, color: "#777" }}>
            Login to view your documents.
          </div>
        )}

        {myDocs.map((doc) => (
          <div key={doc.id} className="doc-item">
            <span onClick={() => setCurrentDoc(doc)} style={{ cursor: "pointer" }}>
              {doc.title || "Untitled document"}
            </span>

            <div className="menu-wrapper">
              <button
                className="menu-btn"
                onClick={() =>
                  setShowMenuFor(showMenuFor === doc.id ? null : doc.id)
                }
              >
                ⋮
              </button>

              {showMenuFor === doc.id && (
                <div className="menu-popup">
                  <div
                    className="menu-item"
                    onClick={() => {
                      if (!user) return alert("Login required.");
                      setRenameDoc(doc);
                      setRenameValue(doc.title || "Untitled document");
                      setShowMenuFor(null);
                    }}
                  >
                    Rename
                  </div>

                  <div
                    className="menu-item"
                    onClick={() => {
                      if (!user) return alert("Login required.");
                      saveDocument(doc.id);
                      setShowMenuFor(null);
                    }}
                  >
                    Save
                  </div>

                  <div
                    className="menu-item"
                    onClick={() => {
                      saveAsDocument(doc.id, doc.title);
                      setShowMenuFor(null);
                    }}
                  >
                    Save As
                  </div>

                  <div
                    className="menu-item"
                    onClick={() => {
                      if (!user) return alert("Login required.");
                      setShowShareModal({ doc });
                      setShowMenuFor(null);
                    }}
                  >
                    Share
                  </div>

                  <div
                    className="menu-item delete"
                    onClick={() => deleteDoc(doc.id)}
                  >
                    Delete
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </aside>

      {/* MAIN EDITOR */}
      <main className="editor-area">
        <div className="editor-container">
          {currentDoc ? (
            <Editor doc={currentDoc} />
          ) : (
            <div className="editor-placeholder">
              {user
                ? "Click + to create a document or select one from the left."
                : "Login to create or open documents."}
            </div>
          )}
        </div>
      </main>

      {/* SHARE MODAL */}
      {showShareModal && (
        <ShareModal
          doc={showShareModal.doc}
          onClose={() => setShowShareModal(null)}
        />
      )}

      {/* RENAME MODAL */}
      {renameDoc && (
        <div className="modal-bg">
          <div className="modal-box">
            <h3>Rename Document</h3>
            <input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 6,
                border: "1px solid #ccc",
                marginTop: 10,
              }}
            />
            <div className="rename-actions">
              <button className="btn btn-cancel-small" onClick={() => setRenameDoc(null)}>
                Cancel
              </button>
              <button className="btn btn-create-small" onClick={saveRename}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
