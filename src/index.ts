import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import rateLimit from "express-rate-limit";
import connectDB from "./db";
import User from "./Routes/user";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Protect against DDOS and brute force!
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again after 15 minutes" }
});

app.use(limiter);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use("/api/v1", User);

// Socket.io for Real-Time Collaboration
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-note", (noteId) => {
    socket.join(noteId);
    console.log(`Socket ${socket.id} joined note ${noteId}`);
  });

  socket.on("send-changes", (noteId, content) => {
    // Broadcast changes to everyone else in the room
    socket.to(noteId).emit("receive-changes", content);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

async function start() {
  await connectDB();
  // Listen on the HTTP server, not the Express app directly!
  server.listen(3001, () => {
    console.log("Server is UP on port 3001");
  });
}

start().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
