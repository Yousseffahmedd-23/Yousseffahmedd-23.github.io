import "dotenv/config";
import fs from "fs";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import "./models/registerAll.js";
import { connectDb } from "./db.js";
import { ensureMongoCollections } from "./mongoCollections.js";
import { requestId } from "./middleware/requestId.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { uploadsDir } from "./routes/files.js";

import authRouter from "./routes/auth.js";
import meRouter from "./routes/me.js";
import adminRouter from "./routes/admin.js";
import parentRouter from "./routes/parent.js";
import teacherRouter from "./routes/teacher.js";
import studentRouter from "./routes/student.js";
import filesRouter from "./routes/files.js";

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const mongoUri = process.env.MONGODB_URI;

app.use(requestId);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "mern-api" });
});

app.use("/api/auth", authRouter);
app.use("/api/me", meRouter);
app.use("/api/admin", adminRouter);
app.use("/api/parent", parentRouter);
app.use("/api/teacher", teacherRouter);
app.use("/api/student", studentRouter);
app.use("/api/files", filesRouter);

app.use(errorHandler);

async function main() {
  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    console.error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set");
    process.exit(1);
  }

  if (mongoUri) {
    try {
      await connectDb(mongoUri);
      console.log("Connected to MongoDB");
      try {
        await ensureMongoCollections();
      } catch (e) {
        console.warn("MongoDB collection/index setup warning:", e.message);
      }
    } catch (e) {
      console.warn("MongoDB connection failed; API still running:", e.message);
    }
  } else {
    console.warn("MONGODB_URI not set; API runs without database");
  }

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
