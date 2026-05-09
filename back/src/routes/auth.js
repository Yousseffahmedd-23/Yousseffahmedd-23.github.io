import { Router } from "express";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";
import crypto from "crypto";
import { AppError } from "../utils/AppError.js";
import { User } from "../models/User.js";
import { AdminProfile } from "../models/AdminProfile.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signAccess, signRefresh, verifyRefresh } from "../utils/tokens.js";
import { PasswordResetToken } from "../models/PasswordResetToken.js";

const router = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 80, standardHeaders: true, legacyHeaders: false });
const strictLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 25, standardHeaders: true, legacyHeaders: false });

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      code: "VALIDATION",
      message: "Validation failed",
      details: errors.array(),
      requestId: req.requestId,
    });
  }
  next();
}

router.use(authLimiter);

router.post(
  "/bootstrap-admin",
  strictLimiter,
  body("bootstrapToken").isString(),
  body("email").isEmail(),
  body("password").isLength({ min: 8 }),
  body("firstName").optional().isString(),
  body("lastName").optional().isString(),
  validate,
  async (req, res, next) => {
    try {
      const expected = process.env.BOOTSTRAP_TOKEN;
      if (!expected || req.body.bootstrapToken !== expected) {
        throw new AppError(403, "Invalid bootstrap token", "FORBIDDEN");
      }
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount > 0) {
        throw new AppError(403, "Bootstrap disabled: admin exists", "BOOTSTRAP_CLOSED");
      }
      const exists = await User.findOne({ email: req.body.email.toLowerCase() });
      if (exists) throw new AppError(409, "Email in use", "CONFLICT");

      const user = await User.create({
        email: req.body.email.toLowerCase(),
        passwordHash: await hashPassword(req.body.password),
        role: "admin",
      });
      await AdminProfile.create({
        userId: user._id,
        firstName: req.body.firstName ?? "",
        lastName: req.body.lastName ?? "",
      });

      const accessToken = signAccess({ sub: String(user._id), role: user.role });
      const refreshToken = signRefresh({ sub: String(user._id), typ: "refresh" });

      res.status(201).json({
        accessToken,
        refreshToken,
        user: { id: user._id, email: user.email, role: user.role },
      });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/login",
  strictLimiter,
  body("email").isEmail(),
  body("password").isString(),
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findOne({ email: req.body.email.toLowerCase() }).select("+passwordHash");
      if (!user || !user.isActive) throw new AppError(401, "Invalid credentials", "AUTH_FAILED");
      const ok = await verifyPassword(req.body.password, user.passwordHash);
      if (!ok) throw new AppError(401, "Invalid credentials", "AUTH_FAILED");

      const accessToken = signAccess({ sub: String(user._id), role: user.role });
      const refreshToken = signRefresh({ sub: String(user._id), typ: "refresh" });

      res.json({
        accessToken,
        refreshToken,
        user: { id: user._id, email: user.email, role: user.role },
      });
    } catch (e) {
      next(e);
    }
  },
);

router.post("/logout", (_req, res) => {
  res.status(204).send();
});

router.post(
  "/refresh",
  body("refreshToken").isString(),
  validate,
  async (req, res, next) => {
    try {
      const decoded = verifyRefresh(req.body.refreshToken);
      const user = await User.findById(decoded.sub);
      if (!user || !user.isActive) throw new AppError(401, "Unauthorized", "AUTH_INVALID");
      const accessToken = signAccess({ sub: String(user._id), role: user.role });
      res.json({ accessToken });
    } catch (e) {
      next(e instanceof AppError ? e : new AppError(401, "Invalid refresh token", "AUTH_INVALID"));
    }
  },
);

router.post(
  "/password/reset/request",
  strictLimiter,
  body("email").isEmail(),
  validate,
  async (req, res, next) => {
    try {
      const email = req.body.email.toLowerCase();
      const user = await User.findOne({ email });
      const noop = () => res.json({ ok: true });

      if (!user || !user.isActive) {
        if (!user) console.info(`[pwd-reset] no user for ${email} (masked)`);
        return noop();
      }

      await PasswordResetToken.deleteMany({ userId: user._id });

      const raw = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

      await PasswordResetToken.create({ userId: user._id, tokenHash, expiresAt });

      console.info("[pwd-reset] token for development (do not use in prod):", { email: user.email, token: raw, expiresAt });

      res.json({ ok: true, devToken: process.env.NODE_ENV === "production" ? undefined : raw });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/password/reset/confirm",
  strictLimiter,
  body("token").isString(),
  body("password").isLength({ min: 8 }),
  validate,
  async (req, res, next) => {
    try {
      const tokenHash = crypto.createHash("sha256").update(req.body.token).digest("hex");
      const row = await PasswordResetToken.findOne({ tokenHash, usedAt: null });
      if (!row || row.expiresAt < new Date()) {
        throw new AppError(400, "Invalid or expired token", "TOKEN_INVALID");
      }
      const user = await User.findById(row.userId).select("+passwordHash");
      if (!user || !user.isActive) throw new AppError(400, "Invalid token", "TOKEN_INVALID");

      user.passwordHash = await hashPassword(req.body.password);
      await user.save();

      row.usedAt = new Date();
      await row.save();

      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  },
);

export default router;
