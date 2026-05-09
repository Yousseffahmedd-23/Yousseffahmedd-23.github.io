import dotenv from "dotenv";
dotenv.config(); // ← must be FIRST — loads back/.env before any other import reads env vars

import fs from "fs";
import { createServer } from "http";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import "./models/registerAll.js";
import { connectDb } from "./db.js";
import { ensureMongoCollections } from "./mongoCollections.js";
import { requestId } from "./middleware/requestId.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { uploadsDir } from "./routes/files.js";
import { initSocket } from "./socket.js";

import authRouter    from "./routes/auth.js";
import meRouter      from "./routes/me.js";
import adminRouter   from "./routes/admin.js";
import parentRouter  from "./routes/parent.js";
import teacherRouter from "./routes/teacher.js";
import studentRouter from "./routes/student.js";
import filesRouter   from "./routes/files.js";

// ── Validate required environment variables IMMEDIATELY ──────────────────────
const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI || MONGO_URI.trim() === "") {
  console.error("❌  MONGODB_URI is not defined in back/.env");
  console.error("    1. Copy  back/.env.example  →  back/.env");
  console.error("    2. Set   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/school");
  console.error("    3. Restart the server");
  process.exit(1);
}

if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.error("❌  JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in back/.env");
  process.exit(1);
}

// ── Express + HTTP server ────────────────────────────────────────────────────
const app        = express();
const httpServer = createServer(app);
const PORT       = Number(process.env.PORT) || 5000;

let dbStatus = "disconnected";

const allowedOrigins = [
  process.env.CLIENT_ORIGIN || "http://localhost:5173",
  process.env.ADMIN_ORIGIN  || "http://localhost:5174",
  process.env.CORS_ORIGIN   || "http://localhost:5173",
].filter(Boolean);

app.use(requestId);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "2mb" }));

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// ── Health check (no DB required) ───────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    ok:       true,
    service:  "mern-api",
    realtime: true,
    db:       dbStatus,
    env: {
      node:       process.version,
      mongoUri:   MONGO_URI ? "set" : "MISSING",
      jwtAccess:  process.env.JWT_ACCESS_SECRET  ? "set" : "MISSING",
      jwtRefresh: process.env.JWT_REFRESH_SECRET ? "set" : "MISSING",
    },
  });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",    authRouter);
app.use("/api/me",      meRouter);
app.use("/api/admin",   adminRouter);
app.use("/api/parent",  parentRouter);
app.use("/api/teacher", teacherRouter);
app.use("/api/student", studentRouter);
app.use("/api/files",   filesRouter);

app.use(errorHandler);

initSocket(httpServer, allowedOrigins);

// ── Main: connect DB FIRST, then start server ────────────────────────────────
async function main() {
  // Step 1 — Connect to MongoDB (must succeed before server accepts requests)
  console.log("⏳  MongoDB connecting...");
  try {
    await connectDb(MONGO_URI);
    dbStatus = "connected";
    console.log("✅  MongoDB connected successfully");

    try {
      await ensureMongoCollections();
    } catch (e) {
      console.warn("⚠️   Collection/index setup warning:", e.message);
    }
  } catch (e) {
    dbStatus = "error";
    console.error("❌  MongoDB connection failed:", e.message);
    console.error("");
    console.error("    ── How to fix ─────────────────────────────────────────");
    console.error("    1. Open MongoDB Atlas → Network Access");
    console.error('       → Add IP Address → "Allow access from anywhere" (0.0.0.0/0)');
    console.error("    2. Make sure the Atlas cluster is not paused");
    console.error("    3. Use the SRV format in back/.env:");
    console.error("       MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/school");
    console.error("    4. Re-run: node src/index.js");
    console.error("    ───────────────────────────────────────────────────────");
    console.error("    Server starting anyway — all DB routes return 503 until fixed.");
    console.error("");
  }

  // Step 2 — Start HTTP server (after DB attempt)
  httpServer.listen(PORT, () => {
    console.log("");
    console.log(`🚀  API + Socket.io  →  http://localhost:${PORT}`);
    console.log(`📊  DB status        →  ${dbStatus}`);
    console.log(`🌐  CORS             →  ${allowedOrigins.join(", ")}`);
    console.log("");
  });
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
