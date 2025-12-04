import React, { useState } from "react";
import axios from "../api/axios";

export default function RenameModal({ doc, onClose, onRenamed }) {
  const [title, setTitle] = useState(doc.title);

  const handleRename = async () => {
    try {
      await axios.put(`/documents/${doc.id}`, {
        title,
      });
      onRenamed();
      onClose();
    } catch (err) {
      alert("Rename failed");
    }
  };

  return (
    <div className="share-modal-backdrop">
      <div className="share-modal">
        <h3>Rename Document</h3>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ marginTop: 10 }}
        />

        <div className="share-modal-actions">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" onClick={handleRename}>
            Rename
          </button>
        </div>
      </div>
    </div>
  );
}
