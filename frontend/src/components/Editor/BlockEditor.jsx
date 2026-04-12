import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Image from '@tiptap/extension-image'
import FontFamily from '@tiptap/extension-font-family'
import TextStyle from '@tiptap/extension-text-style'
import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
const MenuBar = ({ editor }) => {
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAIAutoComplete = async () => {
    // Get text from the current selection
    const { state } = editor;
    const { from, to } = state.selection;
    let contextText = state.doc.textBetween(Math.max(0, from - 100), to, ' ');

    if (!contextText.trim()) {
      contextText = "General continuation";
    }

    setIsAiLoading(true);
    try {
      // In a real app, this hitting an OpenAI gateway. We are hitting our mocked Express route.
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:3001/api/v1";
      const res = await fetch(`${backendUrl}/ai/autocomplete`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ context: contextText })
      });
      const data = await res.json();
      
      if (data.success) {
        editor.chain().focus().insertContent(data.text).run();
      }
    } catch (err) {
      console.error("AI Generation failed", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 mb-4 border border-border rounded-lg bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
      <button
        onClick={handleAIAutoComplete}
        disabled={isAiLoading}
        className="px-2 py-1 rounded text-sm font-bold bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 transition-colors flex items-center border border-indigo-500/20"
      >
        {isAiLoading ? "✨ Thinking..." : "✨ AI Copilot"}
      </button>
      <div className="w-px h-4 bg-border mx-1" />
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`px-2 py-1 rounded text-sm font-semibold transition-colors ${editor.isActive('bold') ? 'bg-foreground text-background' : 'hover:bg-muted text-foreground'}`}
      >
        B
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`px-2 py-1 rounded text-sm italic transition-colors ${editor.isActive('italic') ? 'bg-foreground text-background' : 'hover:bg-muted text-foreground'}`}
      >
        I
      </button>
      <div className="w-px h-4 bg-border mx-1" />
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`px-2 py-1 rounded text-sm font-bold transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-foreground text-background' : 'hover:bg-muted text-foreground'}`}
      >
        H1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-2 py-1 rounded text-sm font-bold transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-foreground text-background' : 'hover:bg-muted text-foreground'}`}
      >
        H2
      </button>
      <div className="w-px h-4 bg-border mx-1" />
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 rounded text-sm transition-colors ${editor.isActive('bulletList') ? 'bg-foreground text-background' : 'hover:bg-muted text-foreground'}`}
      >
        • List
      </button>
      <button
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={`px-2 py-1 rounded text-sm transition-colors ${editor.isActive('taskList') ? 'bg-foreground text-background' : 'hover:bg-muted text-foreground'}`}
      >
        ☑ To-Do
      </button>
      <div className="w-px h-4 bg-border mx-1" />
      <select 
        className="bg-transparent border border-border rounded px-2 py-1 text-sm outline-none cursor-pointer focus:border-foreground"
        onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
        value={editor.getAttributes('textStyle').fontFamily || ''}
      >
        <option value="">Default Font</option>
        <option value="Inter">Inter</option>
        <option value="Comic Sans MS, Comic Sans">Comic Sans</option>
        <option value="serif">Serif</option>
        <option value="monospace">Monospace</option>
      </select>
    </div>
  )
}

const BlockEditor = ({ content, onChange, editable = true, noteId }) => {
  const socketRef = useRef(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontFamily,
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({ inline: true, allowBase64: true }),
      Placeholder.configure({
        placeholder: 'Press "/" for commands, or drop an image here...',
      }),
    ],
    content: content,
    editable: editable,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none max-w-none text-foreground dark:prose-invert',
      },
      handleDrop: function(view, event, slice, moved) {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
              const { schema } = view.state;
              const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
              const node = schema.nodes.image.create({ src: readerEvent.target.result });
              const transaction = view.state.tr.insert(coordinates.pos, node);
              view.dispatch(transaction);
            };
            reader.readAsDataURL(file);
            return true; 
          }
        }
        return false;
      }
    },
    onUpdate: ({ editor, transaction }) => {
      const html = editor.getHTML()
      onChange(html)

      // Only emit socket changes if it was a local user typing (not an incoming socket sync)
      if (socketRef.current && !transaction.getMeta('isSocketSync')) {
        socketRef.current.emit("send-changes", noteId, html);
      }
    },
  })

  // Socket.io Real-Time Collaboration Setup
  useEffect(() => {
    if (!noteId || noteId === "welcome") return;
    
    const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL 
      ? import.meta.env.VITE_BACKEND_BASE_URL.replace('/api/v1', '') 
      : "http://localhost:3001";
      
    socketRef.current = io(backendUrl);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-note", noteId);
    });

    socketRef.current.on("receive-changes", (incomingHtml) => {
      if (editor && editor.getHTML() !== incomingHtml) {
        setIsSyncing(true);
        // Setting content with a custom meta transaction to avoid feedback loops
        const { state, view } = editor;
        const tr = state.tr;
        const selection = state.selection;
        
        // This is a simplified overwrite approach for keeping code simple.
        // A true CRDT uses Yjs, but this fulfills the real-time req simply!
        editor.commands.setContent(incomingHtml, false);
        
        setTimeout(() => setIsSyncing(false), 500);
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    }
  }, [noteId, editor]);

  // Sync content when it changes externally (initial load)
  useEffect(() => {
    if (editor && content !== editor.getHTML() && !isSyncing) {
      editor.commands.setContent(content, false)
    }
  }, [content, editor, isSyncing])

  if (!editor) {
    return null
  }

  return (
    <div className="w-full relative">
      {editable && <MenuBar editor={editor} />}
      
      <div className={`border rounded-lg bg-background shadow-minimal transition-colors pt-4 px-4 pb-20 min-h-[60vh] ${
        editable ? 'border-border focus-within:border-muted-foreground/30' : 'border-transparent'
      }`}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

export default BlockEditor
