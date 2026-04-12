import express from "express";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import User from "../models/userModel";
import Content from "../models/contentModel";
import ContentHistory from "../models/contentHistoryModel";
import APIKey from "../models/apiKeyModel";
import { authenticate, authenticateApiKey } from "../middleware";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_local_dev";

// Unified Auth Middleware (Supports both JWT and x-api-key)
const requireAuth = (req: any, res: any, next: any) => {
  if (req.header("x-api-key")) {
    return authenticateApiKey(req, res, next);
  }
  return authenticate(req, res, next);
};

// --- AUTHENTICATION ---
router.post("/signup", async (req: any, res: any) => {
  try {
    const { user_name, email, password } = req.body;
    if (!user_name || !email || !password) return res.status(400).json({ error: "All fields required" });

    const existingUser = await User.findOne({ $or: [{ user_name }, { email }] });
    if (existingUser) return res.status(409).json({ error: "Username or email exists" });

    const new_User = new User({ user_name, email, password }); 
    await new_User.save();

    const welcomeNote = new Content({
      userId: new_User._id,
      title: "Welcome to Enterprise Brain!",
      content: "<p>Try out the advanced Enterprise features.</p>",
    });
    await welcomeNote.save();

    res.status(200).json({ success: true, message: "User created" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/signin", async (req: any, res: any) => {
  try {
    const { user_name, password } = req.body;
    const user_Data = await User.findOne({ $or: [{ user_name: user_name }, { email: user_name }] });
    if (!user_Data || user_Data.password !== password) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user_Data._id, username: user_Data.user_name, email: user_Data.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ success: true, token, username: user_Data.user_name, email: user_Data.email });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/users/is-logged", authenticate, (req: any, res: any) => {
  res.status(200).json({ success: true, username: req.user.username, email: req.user.email });
});

// --- API KEYS ---
router.post("/developer/api-keys", authenticate, async (req: any, res: any) => {
  try {
    const { name } = req.body;
    const newKey = new APIKey({ userId: req.user.id, name: name || "Default Key", key: uuidv4() });
    await newKey.save();
    res.status(201).json({ success: true, apiKey: newKey.key });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- NOTES (Authenticated via JWT or API Key) ---
router.get("/notes", requireAuth, async (req: any, res: any) => {
  try {
    // Implement Advanced filters via req.query
    const { tag, role } = req.query;
    let query: any = {};
    if (role === 'owner') {
      query.userId = req.user.id;
    } else if (role === 'shared') {
      query["sharedWith.email"] = req.user.email;
    } else {
      query.$or = [{ userId: req.user.id }, { "sharedWith.email": req.user.email }];
    }

    if (tag) query.tags = tag;

    const notes = await Content.find(query).sort({ updatedAt: -1 });
    res.status(200).json({ notes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/notes/search", requireAuth, async (req: any, res: any) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Missing query" });
    const notes = await Content.find(
      { $or: [{ userId: req.user.id }, { "sharedWith.email": req.user.email }], $text: { $search: String(q) } },
      { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" } });
    res.status(200).json({ notes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/notes", requireAuth, async (req: any, res: any) => {
  try {
    const { title, content, tags } = req.body;
    const newNote = new Content({ userId: req.user.id, title: title || "Untitled Note", content: content || "", tags: tags || [] });
    await newNote.save();
    res.status(201).json({ success: true, note: newNote });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/notes/:id", requireAuth, async (req: any, res: any) => {
  try {
    const note = await Content.findOne({ _id: req.params.id, $or: [{ userId: req.user.id }, { "sharedWith.email": req.user.email }] });
    if (!note) return res.status(404).json({ error: "Not found or forbidden" });
    
    const isOwner = note.userId.toString() === req.user.id;
    const sharedRecord = note.sharedWith.find((s:any) => s.email === req.user.email);
    const role = isOwner ? 'owner' : (sharedRecord ? sharedRecord.role : 'viewer');

    res.status(200).json({ note, role });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update with Optimistic Locking (__v check omitted for this simple integration, but we track history!)
router.put("/notes/:id", requireAuth, async (req: any, res: any) => {
  try {
    const { title, content, tags, sharedWith, isPublic } = req.body;
    
    const note = await Content.findOne({ _id: req.params.id });
    if (!note) return res.status(404).json({ error: "Not found" });

    const isOwner = note.userId.toString() === req.user.id;
    const isEditor = note.sharedWith.some((s:any) => s.email === req.user.email && s.role === 'editor');
    if (!isOwner && !isEditor) return res.status(403).json({ error: "View only access" });

    const updateData: any = { title, content, tags };
    if (isOwner) {
      if (sharedWith !== undefined) updateData.sharedWith = sharedWith;
      if (isPublic !== undefined) updateData.isPublic = isPublic;
    }

    // Force Mongoose to increment __v internally if we used versionKey: true
    const updatedNote = await Content.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    if (updatedNote) {
      // Save Version Ledger!
      const history = new ContentHistory({
        noteId: updatedNote._id,
        savedBy: req.user.id,
        title: updatedNote.title,
        content: updatedNote.content,
        version: updatedNote.__v
      });
      await history.save();
    }

    res.status(200).json({ success: true, note: updatedNote });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- VERSION HISTORY ---
router.get("/notes/:id/history", requireAuth, async (req: any, res: any) => {
  try {
    // Auth check
    const note = await Content.findOne({ _id: req.params.id, $or: [{ userId: req.user.id }, { "sharedWith.email": req.user.email }] });
    if (!note) return res.status(404).json({ error: "Forbidden" });

    const history = await ContentHistory.find({ noteId: req.params.id }).sort({ createdAt: -1 }).limit(50).populate("savedBy", "user_name email");
    res.status(200).json({ history });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/notes/:id", requireAuth, async (req: any, res: any) => {
  try {
    const deletedNote = await Content.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deletedNote) return res.status(403).json({ error: "Only owner can delete" });
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/brain/:shareLink", async (req: any, res: any) => {
  try {
    const note = await Content.findOne({ _id: req.params.shareLink, isPublic: true });
    if (!note) return res.status(404).json({ error: "Not public" });
    res.status(200).json({ success: true, data: note });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
