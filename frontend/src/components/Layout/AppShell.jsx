import { Outlet, useNavigate, useParams, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useEffect, useState, useCallback } from "react";
import api from "../../utils/api";

export function AppShell() {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  // Redirect to login if no token is found
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token && !location.pathname.startsWith("/login") && !location.pathname.startsWith("/register")) {
      navigate("/login");
    }
  }, [navigate, location.pathname]);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await api.get("/notes");
      if (res.data.notes) {
        setNotes(res.data.notes);
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      fetchNotes();
    } else {
      setIsLoading(false);
    }
  }, [fetchNotes]);

  const handleCreateNote = async () => {
    try {
      const res = await api.post("/notes", { title: "", content: "" });
      if (res.data.success && res.data.note) {
        setNotes([res.data.note, ...notes]);
        navigate(`/p/${res.data.note._id}`);
      }
    } catch (err) {
      console.error("Failed to create note", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin opacity-50" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <Sidebar 
        notes={notes} 
        createNote={handleCreateNote} 
        currentNoteId={params.pageId} 
      />
      <main className="flex-1 relative overflow-y-auto">
        <Outlet context={{ setNotes, notes, fetchNotes }} />
      </main>
    </div>
  );
}
