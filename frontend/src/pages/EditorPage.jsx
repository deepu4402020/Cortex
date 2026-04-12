import { useEffect, useState, useMemo } from "react";
import { useParams, useOutletContext, useNavigate } from "react-router-dom";
import BlockEditor from "../components/Editor/BlockEditor";
import { useAutoSave } from "../hooks/useAutoSave";
import { FiShare2, FiSettings } from "react-icons/fi";
import api from "../utils/api";

export default function EditorPage() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const { setNotes, notes, fetchNotes } = useOutletContext();
  
  const [noteData, setNoteData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState('viewer');

  // Auto-save logic
  const handleSave = async (dataToSave) => {
    if (!pageId || pageId === "welcome" || role === 'viewer') return;
    try {
      await api.put(`/notes/${pageId}`, {
        title: dataToSave.title,
        content: dataToSave.content
      });
      setNotes(notes.map(n => n._id === pageId ? { ...n, title: dataToSave.title } : n));
    } catch (err) {
      console.error("Failed to save note", err);
    }
  };

  const { isSaving } = useAutoSave(noteData, handleSave, 1000);

  useEffect(() => {
    let active = true;
    const fetchNote = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/notes/${pageId}`);
        if (active && res.data.note) {
          setNoteData(res.data.note);
          setRole(res.data.role);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          navigate("/p/welcome"); // It will redirect, and the backend welcome generator triggers if needed
        }
        console.error("Error fetching note:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    if (pageId && pageId !== "welcome") {
      fetchNote();
    } else {
      setIsLoading(false);
    }
    return () => { active = false; };
  }, [pageId, navigate]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this page?")) return;
    try {
      await api.delete(`/notes/${pageId}`);
      await fetchNotes(); 
      navigate("/p/welcome");
    } catch (err) {
      alert("Only the owner can delete this note.");
    }
  };

  const handleSharePublic = async () => {
    try {
      await api.put(`/notes/${pageId}`, { isPublic: true });
      const link = `${window.location.origin}/brain/${pageId}`;
      navigator.clipboard.writeText(link);
      alert("Link copied to clipboard! Anyone with this link can view the note.");
    } catch (err) {
      alert("Failed to create share link. You must be the owner.");
    }
  };

  const handleShareEmail = async () => {
    const emailToShare = window.prompt("Enter the registered email of the user to share with:");
    if (!emailToShare) return;
    
    const rolePrompt = window.prompt("Enter role: 'viewer' or 'editor'", "viewer");
    if (!rolePrompt || !['viewer', 'editor'].includes(rolePrompt)) {
      alert("Invalid role. Role must be 'viewer' or 'editor'");
      return;
    }

    try {
      // Append the new email to existing sharedWith array
      const newSharedWith = [...(noteData.sharedWith || []), { email: emailToShare, role: rolePrompt }];
      await api.put(`/notes/${pageId}`, { sharedWith: newSharedWith });
      setNoteData({ ...noteData, sharedWith: newSharedWith });
      alert(`Successfully shared with ${emailToShare} as ${rolePrompt}!`);
    } catch (err) {
      alert("Failed to share via email.");
      console.error(err);
    }
  };

  // Live Stats Calculator (Premium Feature)
  const stats = useMemo(() => {
    if (!noteData?.content) return { words: 0, chars: 0, readTime: "0 min" };
    // Strip HTML to get plain text roughly
    const text = noteData.content.replace(/<[^>]+>/g, ' ');
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const chars = text.length;
    const readTime = Math.ceil(words / 200); // avg 200 WPM
    return { words, chars, readTime: `${readTime} min read` };
  }, [noteData?.content]);

  if (isLoading || !noteData) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin opacity-50" />
      </div>
    );
  }

  const isEditable = role !== 'viewer';

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Topbar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="text-xs text-muted-foreground truncate rounded px-2 py-1 bg-muted/30 uppercase tracking-wider">
          {role}
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-xs text-muted-foreground hidden sm:block">
            {stats.words} words • {stats.readTime}
          </div>
          <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60 w-20 text-right">
            {isEditable ? (isSaving ? "Saving..." : "Saved") : "Read Only"}
          </div>
          
          {role === 'owner' && (
            <>
              <button onClick={handleShareEmail} className="text-xs font-semibold px-2 py-1 text-muted-foreground hover:text-foreground transition-colors hover:bg-muted rounded" title="Share with email">
                Share...
              </button>
              <button onClick={handleSharePublic} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors hover:bg-muted rounded" title="Share public link">
                <FiShare2 className="w-4 h-4" />
              </button>
              <button onClick={handleDelete} className="text-xs text-muted-foreground hover:text-red-500 transition-colors ml-2">
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="max-w-4xl mx-auto w-full px-6 py-8 md:py-12 flex flex-col flex-1">
        <input
          type="text"
          value={noteData.title}
          onChange={(e) => setNoteData({ ...noteData, title: e.target.value })}
          disabled={!isEditable}
          placeholder="Untitled"
          className="w-full bg-transparent text-4xl md:text-5xl font-bold tracking-tight text-foreground border-none outline-none mb-6 placeholder:text-muted-foreground/30 focus:ring-0"
        />
        
        <BlockEditor 
          content={noteData.content} 
          onChange={(html) => setNoteData((prev) => ({ ...prev, content: html }))} 
          editable={isEditable}
          noteId={pageId}
        />
      </div>
    </div>
  );
}
