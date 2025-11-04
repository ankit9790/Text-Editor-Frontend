import { Routes, Route, useParams } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Editor from "./components/Editor.jsx";
import Navbar from "./components/Navbar.jsx";
import "./App.css";

function EditorWrapper() {
  const { id } = useParams();
  return <Editor docId={id} />;
}

export default function App() {
  return (
    <div className="app-root">
      <Navbar />
      <div className="app-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/editor/:id" element={<EditorWrapper />} />
        </Routes>
      </div>
    </div>
  );
}
