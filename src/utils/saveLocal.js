// Save document content to localStorage
export function saveDocumentLocally(docId, content) {
  try {
    localStorage.setItem(`doc_${docId}`, content);
    console.log("💾 Saved to localStorage:", `doc_${docId}`);
  } catch (err) {
    console.error("Local save error", err);
  }
}
