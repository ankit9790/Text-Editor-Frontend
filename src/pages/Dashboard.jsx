import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import Editor from "../components/Editor";
import io from "socket.io-client";

const socket = io("http://localhost:3000");

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [joinId, setJoinId] = useState("");
  const [user, setUser] = useState(null); // <-- NEW: current user

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };
    fetchUser();
  }, []);

  // Fetch user documents
  const fetchDocs = async () => {
    try {
      const res = await axios.get("/documents");
      setDocuments(res.data);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  // Create new document
  const createDoc = async () => {
    try {
      const res = await axios.post("/documents", {
        title: "Untitled",
        content: "",
      });
      setDocuments([...documents, res.data]);
      setCurrentDoc(res.data);
    } catch (err) {
      console.error("Failed to create document:", err);
    }
  };

  // Delete document
  const deleteDoc = async (id) => {
    try {
      await axios.delete(`/documents/${id}`);
      setDocuments(documents.filter((doc) => doc.id !== id));
      if (currentDoc?.id === id) setCurrentDoc(null);
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  };

  // Join document by ID
  const joinDocument = async () => {
    const doc = documents.find((d) => d.id === parseInt(joinId));
    if (doc) setCurrentDoc(doc);
    else alert("Document not found!");
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-title">Collaborative Text Editor</div>
        <div className="join-container">
          <input
            type="text"
            placeholder="Enter Document ID"
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
          />
          <button onClick={joinDocument}>Join</button>
        </div>
      </nav>

      {/* Dashboard */}
      <div className="dashboard">
        {/* Documents list */}
        <div className="doc-list">
          {user && (
            <div className="current-user">
              Logged in as: <strong>{user.username}</strong>
            </div>
          )}
          <h3>Your Documents</h3>
          <button onClick={createDoc}>+ New File</button>
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
