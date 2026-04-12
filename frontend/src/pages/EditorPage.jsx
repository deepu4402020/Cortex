import { useEffect, useState, useMemo } from "react";
import { useParams, useOutletContext, useNavigate } from "react-router-dom";
import BlockEditor from "../components/Editor/BlockEditor";
import { useAutoSave } from "../hooks/useAutoSave";
import { FiShare2, FiClock, FiKey } from "react-icons/fi";
import api from "../utils/api";

export default function EditorPage() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const { setNotes, notes, fetchNotes } = useOutletContext();
  
  const [noteData, setNoteData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState('viewer');
  
  // History state
  const [showHistory, setShowHistory] = useState(false);
  const [historyLedger, setHistoryLedger] = useState([]);

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
          navigate("/p/welcome"); 
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    if (pageId && pageId !== "welcome") {
      fetchNote();
      setShowHistory(false);
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
      alert("Link copied to clipboard!");
    } catch (err) {
      alert("Failed to create share link.");
    }
  };

  const handleShareEmail = async () => {
    const emailToShare = window.prompt("Enter the registered email of the user to share with:");
    if (!emailToShare) return;
    
    const rolePrompt = window.prompt("Enter role: 'viewer' or 'editor'", "viewer");
    if (!rolePrompt || !['viewer', 'editor'].includes(rolePrompt)) {
      alert("Invalid role. Must be 'viewer' or 'editor'");
      return;
    }

    try {
      const newSharedWith = [...(noteData.sharedWith || []), { email: emailToShare, role: rolePrompt }];
      await api.put(`/notes/${pageId}`, { sharedWith: newSharedWith });
      setNoteData({ ...noteData, sharedWith: newSharedWith });
      alert(`Shared with ${emailToShare}!`);
    } catch (err) {
      alert("Failed to share.");
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/notes/${pageId}/history`);
      setHistoryLedger(res.data.history);
      setShowHistory(true);
    } catch (err) {
      alert("Failed to fetch history");
    }
  };

  const generateApiKey = async () => {
    try {
      const res = await api.post("/developer/api-keys", { name: `CLI Key for ${pageId}` });
      window.prompt("Your permanent API Key generated. Copy it now, it won't be shown again:", res.data.apiKey);
    } catch (err) {
      alert("Failed to generate API Key");
    }
  }

  const stats = useMemo(() => {
    if (!noteData?.content) return { words: 0, chars: 0, readTime: "0 min" };
    const text = noteData.content.replace(/<[^>]+>/g, ' ');
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    return { words, readTime: `${Math.ceil(words / 200)} min read` };
  }, [noteData?.content]);

  if (isLoading || !noteData) {
    return <div className="flex-1 flex items-center justify-center"><div className="animate-spin w-5 h-5 border-2 border-foreground border-t-transparent rounded-full opacity-50"/></div>;
  }

  const isEditable = role !== 'viewer';

  return (
    <div className="flex flex-col h-full overflow-y-auto relative">
      {/* Topbar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center space-x-2">
          <div className="text-xs text-muted-foreground truncate rounded px-2 py-1 bg-muted/30 uppercase tracking-wider">
            {role}
          </div>
          <button onClick={generateApiKey} className="text-xs text-muted-foreground hover:text-foreground flex items-center transition-colors">
            <FiKey className="mr-1"/> API
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-xs text-muted-foreground hidden sm:block">
            {stats.words} words • {stats.readTime}
          </div>
          <div className="text-[10px] uppercase font-semibold text-muted-foreground/60 w-20 text-right">
            {isEditable ? (isSaving ? "Saving..." : "Saved") : "Read Only"}
          </div>
          
          <button onClick={fetchHistory} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors hover:bg-muted rounded" title="Version History">
             <FiClock className="w-4 h-4" />
          </button>

          {role === 'owner' && (
            <>
              <button onClick={handleShareEmail} className="text-xs font-semibold px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded">
                Share...
              </button>
              <button onClick={handleSharePublic} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors hover:bg-muted rounded">
                <FiShare2 className="w-4 h-4" />
              </button>
              <button onClick={handleDelete} className="text-xs text-muted-foreground hover:text-red-500 transition-colors ml-2">
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 relative">
        {/* Editor Area */}
        <div className="max-w-4xl mx-auto w-full px-6 py-8 flex flex-col flex-1">
          <input
            type="text"
            value={noteData.title}
            onChange={(e) => setNoteData({ ...noteData, title: e.target.value })}
            disabled={!isEditable}
            placeholder="Untitled"
            className="w-full bg-transparent text-4xl font-bold text-foreground border-none outline-none mb-6 focus:ring-0"
          />
          <BlockEditor 
            content={noteData.content} 
            onChange={(html) => setNoteData((prev) => ({ ...prev, content: html }))} 
            editable={isEditable}
            noteId={pageId}
          />
        </div>

        {/* Version History Sidebar */}
        {showHistory && (
          <div className="w-72 border-l border-border bg-muted/10 p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold">Version History</h3>
              <button onClick={() => setShowHistory(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            
            <div className="space-y-4">
              {historyLedger.length === 0 ? (
                <p className="text-xs text-muted-foreground">No history snapshots yet.</p>
              ) : (
                historyLedger.map((snapshot) => (
                  <div key={snapshot._id} className="text-sm p-3 bg-background border border-border rounded shadow-minimal">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-foreground">v{snapshot.version}</span>
                      <span className="text-xs text-muted-foreground">{new Date(snapshot.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2 truncate">
                      Saved by: {snapshot.savedBy.user_name || snapshot.savedBy.email}
                    </div>
                    {/* Real app would use a diff viewer here */}
                    <button 
                      onClick={() => alert("Reverting to history requires complex logic implemented. ")}
                      className="text-xs text-blue-500 hover:underline"
                    >
                      Restore
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
