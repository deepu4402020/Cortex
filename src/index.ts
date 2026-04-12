import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./db";
import User from "./Routes/user";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Keep it simple for dev, usually domain specific
    methods: ["GET", "POST"]
  }
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" })); // Increased limit for base64 images
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
