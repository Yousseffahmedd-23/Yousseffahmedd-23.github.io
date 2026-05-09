import { Router } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../utils/AppError.js";

const router = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename(_req, file, cb) {
    const safe = crypto.randomBytes(16).toString("hex") + path.extname(file.originalname || "");
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.use(requireAuth);

router.post("/", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError(400, "file required", "VALIDATION");
    const relative = `/uploads/${req.file.filename}`;
    res.status(201).json({ url: relative, filename: req.file.filename, originalName: req.file.originalname });
  } catch (e) {
    next(e);
  }
});

export default router;
