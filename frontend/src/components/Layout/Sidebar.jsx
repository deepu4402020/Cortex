import { Link, useNavigate } from "react-router-dom";
import { FiPlus, FiSettings, FiSearch, FiLogOut, FiFileText, FiMoon, FiSun } from "react-icons/fi";
import { useTheme } from "./ThemeProvider";
import { useState, useMemo } from "react";
import Fuse from "fuse.js";

export function Sidebar({ notes, createNote, currentNoteId }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const fuse = useMemo(() => new Fuse(notes, {
    keys: ["title", "content", "tags"],
    threshold: 0.4, // Fuzzy match
  }), [notes]);

  const displayedNotes = searchQuery 
    ? fuse.search(searchQuery).map(res => res.item) 
    : notes;

  return (
    <div className="w-64 h-screen border-r border-border bg-background flex flex-col flex-shrink-0 text-sm transition-colors">
      {/* User Area */}
      <div className="p-4 flex items-center justify-between border-b border-border">
        <span className="font-semibold px-2 py-1 rounded select-none truncate">
          {localStorage.getItem("username") || "My Brain"}'s Brain
        </span>
      </div>

      {/* Action Buttons */}
      <div className="px-3 pt-4 pb-2 space-y-2">
        <div className="relative flex items-center w-full group">
          <FiSearch className="absolute left-3 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/50 focus:bg-muted border border-transparent focus:border-border text-foreground rounded py-1.5 pl-9 pr-3 outline-none transition-colors"
          />
        </div>
        
        <button onClick={toggleTheme} className="flex items-center w-full px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded transition-colors">
          {theme === "dark" ? <FiSun className="mr-2 w-4 h-4" /> : <FiMoon className="mr-2 w-4 h-4" />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 border-t border-border mt-2">
        <div className="flex items-center justify-between px-2 py-1.5 mb-1 group text-muted-foreground hover:text-foreground cursor-pointer" onClick={createNote}>
          <span className="font-medium text-xs tracking-wider uppercase">Private Pages</span>
          <button className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted transition-all" title="New Page">
            <FiPlus className="w-3.5 h-3.5" />
          </button>
        </div>
        
        {displayedNotes && displayedNotes.length > 0 ? (
          displayedNotes.map((note) => (
            <Link
              key={note._id}
              to={`/p/${note._id}`}
              className={`flex items-center w-full px-2 py-1.5 rounded transition-colors group ${
                currentNoteId === note._id ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <FiFileText className="mr-2 w-4 h-4 opacity-70" />
              <span className="truncate">{note.title || "Untitled"}</span>
            </Link>
          ))
        ) : (
          <div className="px-2 py-1.5 text-muted-foreground/50 text-xs italic">
            {searchQuery ? "No matches found." : "No pages inside"}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border flex justify-between">
        <button className="flex items-center px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded transition-colors">
          <FiSettings className="w-4 h-4" />
        </button>
        <button onClick={handleLogout} className="flex flex-1 justify-end items-center px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded transition-colors">
          <span className="mr-2">Logout</span>
          <FiLogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
