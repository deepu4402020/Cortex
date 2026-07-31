import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import rateLimit from "express-rate-limit";
import connectDB from "./db";
import User from "./Routes/user";
import jwt from "jsonwebtoken";
import { startWorker } from "./utils/queue";
import Redis from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";
import { RedisStore } from "rate-limit-redis";

const JWT_SECRET = process.env.JWT_SECRET || "cortex_default_jwt_secret_key_2024";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.warn("[WARNING]: JWT_SECRET environment variable is missing in production. Using fallback secret.");
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Redis clients for Socket.io Pub/Sub and Rate Limiting
const pubClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
});
const subClient = pubClient.duplicate();

pubClient.on("error", (err) => {
  console.error("[Redis PubClient Error] (Rate Limiter / Socket.io may be degraded):", err);
});
subClient.on("error", (err) => {
  console.error("[Redis SubClient Error]:", err);
});

// Protect against DDOS and brute force! (Now horizontally scalable via Redis)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  // Deliberate availability-over-strict-enforcement tradeoff:
  // If Redis dies, let traffic through instead of failing closed and taking down the API.
  passOnStoreError: true,
  store: new RedisStore({
    sendCommand: async (...args: string[]) => {
      if (pubClient.status !== "ready") {
        throw new Error("Redis not ready");
      }
      return pubClient.call(args[0], ...args.slice(1)) as any;
    },
  }),
  message: { error: "Too many requests from this IP, please try again after 15 minutes" }
});

// Configure Socket.io with Redis Adapter for horizontal scaling
io.adapter(createAdapter(pubClient, subClient));

app.use(limiter);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use("/api/v1", User);

app.get("/api/v1/health", (req: any, res: any) => {
  res.json({
    status: "ok",
    mongo: mongoose.connection.readyState === 1 ? "connected" : `disconnected (state ${mongoose.connection.readyState})`,
    redis: pubClient.status,
    env: {
      hasMongoUri: !!(process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL),
      hasRedisUrl: !!process.env.REDIS_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
    }
  });
});

// Socket.io for Real-Time Collaboration
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.token;
  if (!token) {
    return next(new Error("Authentication error: Token missing"));
  }
  
  jwt.verify(token as string, JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error("Authentication error: Invalid token"));
    (socket as any).user = decoded;
    next();
  });
});

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

const PORT = process.env.PORT || 3001;

async function start() {
  server.listen(PORT, async () => {
    console.log(`Server is UP on port ${PORT}`);
    try {
      await connectDB();
      startWorker();
    } catch (err) {
      console.error("Async startup error:", err);
    }
  });
}

start();
