import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/userModel";
import Content from "../models/contentModel";
import { authenticate } from "../middleware";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_local_dev";

// --- AUTHENTICATION ---

router.post("/signup", async (req: any, res: any) => {
  try {
    const { user_name, email, password } = req.body;
    if (!user_name || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required" });
    }

    const existingUser = await User.findOne({ $or: [{ user_name }, { email }] });
    if (existingUser) {
      return res.status(409).json({ error: "Username or email already exists" });
    }

    const new_User = new User({ user_name, email, password }); 
    await new_User.save();

    // Create a Welcome Note automatically
    const welcomeNote = new Content({
      userId: new_User._id,
      title: "Welcome to Second Brain!",
      content: "<p>This is your personal workspace. Start typing or use <strong>/</strong> to see formatting commands.</p><ul><li><p>Try making a list</p></li><li><p>Try dragging an image</p></li></ul>",
    });
    await welcomeNote.save();

    res.status(200).json({ success: true, message: "User created successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/signin", async (req: any, res: any) => {
  try {
    const { user_name, password } = req.body; // we can keep user_name login for simplicity, or allow email
    const user_Data = await User.findOne({ 
      $or: [{ user_name: user_name }, { email: user_name }] 
    });
    
    if (!user_Data || user_Data.password !== password) {
      return res.status(401).json({ error: "Incorrect credentials" });
    }

    const token = jwt.sign(
      { id: user_Data._id, username: user_Data.user_name, email: user_Data.email }, 
      JWT_SECRET, 
      { expiresIn: "7d" }
    );
    res.json({ success: true, token, username: user_Data.user_name, email: user_Data.email });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/users/is-logged", authenticate, (req: any, res: any) => {
  res.status(200).json({ success: true, username: req.user.username, email: req.user.email, message: "Logged in" });
});

// --- NOTES (Authenticated) ---

// Get all notes for the user (owned OR shared)
router.get("/notes", authenticate, async (req: any, res: any) => {
  try {
    const notes = await Content.find({
      $or: [
        { userId: req.user.id },
        { "sharedWith.email": req.user.email }
      ]
    }).sort({ updatedAt: -1 });
    res.status(200).json({ notes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Search functionality via MongoDB text index
router.get("/notes/search", authenticate, async (req: any, res: any) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Query parameter 'q' is required" });

    const notes = await Content.find(
      { 
        $or: [{ userId: req.user.id }, { "sharedWith.email": req.user.email }],
        $text: { $search: String(q) } 
      },
      { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" } });
    
    res.status(200).json({ notes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new note
router.post("/notes", authenticate, async (req: any, res: any) => {
  try {
    const { title, content, tags } = req.body;
    const newNote = new Content({
      userId: req.user.id,
      title: title || "Untitled Note",
      content: content || "",
      tags: tags || []
    });
    await newNote.save();
    res.status(201).json({ success: true, note: newNote });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single note (check ownership or access)
router.get("/notes/:id", authenticate, async (req: any, res: any) => {
  try {
    const note = await Content.findOne({ 
      _id: req.params.id, 
      $or: [{ userId: req.user.id }, { "sharedWith.email": req.user.email }]
    });
    if (!note) return res.status(404).json({ error: "Note not found or no access permission" });
    
    const isOwner = note.userId.toString() === req.user.id;
    const sharedRecord = note.sharedWith.find((s:any) => s.email === req.user.email);
    const role = isOwner ? 'owner' : (sharedRecord ? sharedRecord.role : 'viewer');

    res.status(200).json({ note, role });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update a note (must be owner or editor)
router.put("/notes/:id", authenticate, async (req: any, res: any) => {
  try {
    const { title, content, tags, sharedWith, isPublic } = req.body;
    
    // First, fetch the note to check permissions
    const note = await Content.findOne({ _id: req.params.id });
    if (!note) return res.status(404).json({ error: "Note not found" });

    const isOwner = note.userId.toString() === req.user.id;
    const isEditor = note.sharedWith.some((s:any) => s.email === req.user.email && s.role === 'editor');

    if (!isOwner && !isEditor) {
      return res.status(403).json({ error: "You only have view access to this note" });
    }

    // Only owners can change permissions (sharedWith, isPublic)
    const updateData: any = { title, content, tags };
    if (isOwner) {
      if (sharedWith !== undefined) updateData.sharedWith = sharedWith;
      if (isPublic !== undefined) updateData.isPublic = isPublic;
    }

    const updatedNote = await Content.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.status(200).json({ success: true, note: updatedNote });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a note (only owner!)
router.delete("/notes/:id", authenticate, async (req: any, res: any) => {
  try {
    const deletedNote = await Content.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deletedNote) return res.status(403).json({ error: "Only the owner can delete this note." });
    res.status(200).json({ success: true, message: "Note deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Public share link endpoint (doesn't require auth)
router.get("/brain/:shareLink", async (req: any, res: any) => {
  try {
    const note = await Content.findOne({ _id: req.params.shareLink, isPublic: true });
    if (!note) return res.status(404).json({ error: "Content not found or not public" });
    res.status(200).json({ success: true, data: note });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
