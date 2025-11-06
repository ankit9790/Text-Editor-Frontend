import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import Editor from "../components/Editor";
import io from "socket.io-client";

const socket = io("http://localhost:3000");

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [joinId, setJoinId] = useState("");

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const res = await axios.get("/documents", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setDocuments(res.data);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    }
  };

  const createDoc = async () => {
    if (!newDocTitle.trim()) return;
    try {
      const res = await axios.post(
        "/documents",
        { title: newDocTitle, content: "" },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      setDocuments([...documents, res.data]);
      setShowNewModal(false);
      setNewDocTitle("");
      setTimeout(() => setCurrentDoc(res.data), 50);
    } catch (err) {
      console.error("Failed to create document:", err);
    }
  };

  const deleteDoc = async (id) => {
    try {
      await axios.delete(`/documents/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setDocuments(documents.filter((doc) => doc.id !== id));
      if (currentDoc?.id === id) setCurrentDoc(null);
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  };

  const joinDocument = async () => {
    if (!joinId.trim()) return;
    const exists = documents.find((doc) => doc.id === Number(joinId));
    if (exists) {
      setCurrentDoc(exists);
      setJoinId("");
    } else {
      alert("Document ID not found!");
    }
  };

  return (
    <div className="dashboard-container">
      {/* New File Modal */}
      {showNewModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Create New Document</h3>
            <input
              type="text"
              placeholder="Enter document title"
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
            />
            <div className="modal-actions">
              <button onClick={createDoc} className="btn-primary">
                Create
              </button>
              <button
                onClick={() => setShowNewModal(false)}
                className="btn-danger"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard">
        {/* Documents list */}
        <div className="doc-list">
          <h3>Your Documents</h3>
          <button className="btn-new" onClick={() => setShowNewModal(true)}>
            + New File
          </button>

          <div className="join-box">
            <input
              type="text"
              placeholder="Enter Document ID"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
            />
            <button onClick={joinDocument}>Join</button>
          </div>

          {documents.map((doc) => (
            <div key={doc.id} className="doc-item">
              <span onClick={() => setCurrentDoc(doc)}>{doc.title}</span>
              <button onClick={() => deleteDoc(doc.id)}>Delete</button>
            </div>
          ))}
        </div>

        {/* Editor */}
        <div className="editor-container">
          {currentDoc ? (
            <Editor socket={socket} doc={currentDoc} />
          ) : (
            <div className="editor-placeholder">
              Select or create a document to start editing
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
