import { Router } from "express";
import { body, validationResult } from "express-validator";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../utils/AppError.js";
import { User } from "../models/User.js";
import { verifyPassword, hashPassword } from "../utils/password.js";
import { getProfileForUser, upsertProfile } from "../services/profiles.js";

const router = Router();

router.use(requireAuth);

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

router.get("/", async (req, res, next) => {
  try {
    const profile = await getProfileForUser(req.user);
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role,
        isActive: req.user.isActive,
      },
      profile,
    });
  } catch (e) {
    next(e);
  }
});

router.patch(
  "/profile",
  body("firstName").optional().isString(),
  body("lastName").optional().isString(),
  body("phone").optional().isString(),
  body("address").optional().isString(),
  body("bio").optional().isString(),
  body("subjects").optional().isArray(),
  body("gradeLevel").optional().isString(),
  body("dateOfBirth").optional().isISO8601(),
  validate,
  async (req, res, next) => {
    try {
      const updated = await upsertProfile(req.user, req.body);
      res.json({ profile: updated });
    } catch (e) {
      next(e);
    }
  },
);

router.patch(
  "/password",
  body("currentPassword").isString(),
  body("newPassword").isLength({ min: 8 }),
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id).select("+passwordHash");
      const ok = await verifyPassword(req.body.currentPassword, user.passwordHash);
      if (!ok) throw new AppError(400, "Current password incorrect", "BAD_PASSWORD");
      user.passwordHash = await hashPassword(req.body.newPassword);
      await user.save();
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  },
);

export default router;
