import { Router } from "express";
import { body, param, query, validationResult } from "express-validator";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { AppError } from "../utils/AppError.js";
import { User } from "../models/User.js";
import { hashPassword } from "../utils/password.js";
import { createProfileForNewUser } from "../services/profiles.js";
import { decryptOptional } from "../utils/pii.js";
import { ClassModel } from "../models/Class.js";
import { ClassSchedule } from "../models/ClassSchedule.js";
import { Enrollment } from "../models/Enrollment.js";
import { ParentChildLink } from "../models/ParentChildLink.js";
import { GradebookEntry } from "../models/GradebookEntry.js";
import { FinalReport } from "../models/FinalReport.js";
import { Fee } from "../models/Fee.js";
import { Material } from "../models/Material.js";
import { SystemSetting } from "../models/SystemSetting.js";
import { ParentProfile } from "../models/ParentProfile.js";
import { StudentProfile } from "../models/StudentProfile.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("admin"));

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

/** Users */
router.get("/users", query("role").optional().isString(), query("limit").optional().isInt(), query("page").optional().isInt(), validate, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    const [items, total] = await Promise.all([
      User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
      User.countDocuments(filter),
    ]);
    res.json({ items: items.map((u) => ({ id: u._id, email: u.email, role: u.role, isActive: u.isActive })), total, page, limit });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/users",
  body("email").isEmail(),
  body("password").isLength({ min: 8 }),
  body("role").isIn(["admin", "teacher", "parent", "student"]),
  body("firstName").optional().isString(),
  body("lastName").optional().isString(),
  body("phone").optional().isString(),
  body("address").optional().isString(),
  body("bio").optional().isString(),
  body("subjects").optional().isArray(),
  body("gradeLevel").optional().isString(),
  validate,
  async (req, res, next) => {
    try {
      const exists = await User.findOne({ email: req.body.email.toLowerCase() });
      if (exists) throw new AppError(409, "Email in use", "CONFLICT");

      const user = await User.create({
        email: req.body.email.toLowerCase(),
        passwordHash: await hashPassword(req.body.password),
        role: req.body.role,
      });

      await createProfileForNewUser(req.body.role, user._id, req.body);

      res.status(201).json({ id: user._id, email: user.email, role: user.role });
    } catch (e) {
      next(e);
    }
  },
);

router.patch(
  "/users/:id",
  param("id").isMongoId(),
  body("isActive").optional().isBoolean(),
  body("email").optional().isEmail(),
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) throw new AppError(404, "User not found", "NOT_FOUND");
      if (req.body.email) user.email = req.body.email.toLowerCase();
      if (typeof req.body.isActive === "boolean") user.isActive = req.body.isActive;
      await user.save();
      res.json({ id: user._id, email: user.email, role: user.role, isActive: user.isActive });
    } catch (e) {
      next(e);
    }
  },
);

router.delete("/users/:id", param("id").isMongoId(), validate, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError(404, "Not found", "NOT_FOUND");

    if (user.role !== "student") {
      throw new AppError(400, "Only student users can be deleted by this endpoint", "INVALID_ROLE");
    }

    await Enrollment.updateMany({ studentUserId: user._id }, { $set: { status: "dropped" } });
    await ParentChildLink.deleteMany({ studentUserId: user._id });
    user.isActive = false;
    await user.save();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/** Classes */
router.get("/classes", async (_req, res, next) => {
  try {
    const classes = await ClassModel.find({}).sort({ createdAt: -1 }).lean();
    res.json({ items: classes });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/classes",
  body("name").isString(),
  body("subject").optional().isString(),
  body("gradeLevel").optional().isString(),
  body("academicYear").optional().isString(),
  body("teacherIds").optional().isArray(),
  validate,
  async (req, res, next) => {
    try {
      const c = await ClassModel.create(req.body);
      res.status(201).json(c);
    } catch (e) {
      next(e);
    }
  },
);

router.patch("/classes/:id", param("id").isMongoId(), body("name").optional().isString(), validate, async (req, res, next) => {
  try {
    const c = await ClassModel.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!c) throw new AppError(404, "Not found", "NOT_FOUND");
    res.json(c);
  } catch (e) {
    next(e);
  }
});

router.delete("/classes/:id", param("id").isMongoId(), validate, async (req, res, next) => {
  try {
    await Material.deleteMany({ classId: req.params.id });
    await ClassSchedule.deleteMany({ classId: req.params.id });
    await Enrollment.deleteMany({ classId: req.params.id });
    await GradebookEntry.deleteMany({ classId: req.params.id });
    await ClassModel.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/classes/:id/teachers",
  param("id").isMongoId(),
  body("teacherUserId").isMongoId(),
  validate,
  async (req, res, next) => {
    try {
      const c = await ClassModel.findById(req.params.id);
      if (!c) throw new AppError(404, "Not found", "NOT_FOUND");
      const tid = new mongoose.Types.ObjectId(req.body.teacherUserId);
      if (!c.teacherIds.some((id) => id.equals(tid))) c.teacherIds.push(tid);
      await c.save();
      res.json(c);
    } catch (e) {
      next(e);
    }
  },
);

router.delete(
  "/classes/:classId/teachers/:teacherId",
  param("classId").isMongoId(),
  param("teacherId").isMongoId(),
  validate,
  async (req, res, next) => {
    try {
      const c = await ClassModel.findById(req.params.classId);
      if (!c) throw new AppError(404, "Not found", "NOT_FOUND");
      c.teacherIds = c.teacherIds.filter((id) => String(id) !== req.params.teacherId);
      await c.save();
      res.json(c);
    } catch (e) {
      next(e);
    }
  },
);

/** Schedules */
router.get("/classes/:classId/schedules", param("classId").isMongoId(), validate, async (req, res, next) => {
  try {
    const items = await ClassSchedule.find({ classId: req.params.classId }).lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/classes/:classId/schedules",
  param("classId").isMongoId(),
  body("title").optional().isString(),
  body("slots").optional().isArray(),
  validate,
  async (req, res, next) => {
    try {
      const s = await ClassSchedule.create({ classId: req.params.classId, title: req.body.title, slots: req.body.slots ?? [] });
      res.status(201).json(s);
    } catch (e) {
      next(e);
    }
  },
);

router.delete("/schedules/:scheduleId", param("scheduleId").isMongoId(), validate, async (req, res, next) => {
  try {
    await ClassSchedule.findByIdAndDelete(req.params.scheduleId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/** Enrollments */
router.post(
  "/enrollments",
  body("studentUserId").isMongoId(),
  body("classId").isMongoId(),
  validate,
  async (req, res, next) => {
    try {
      const e = await Enrollment.findOneAndUpdate(
        { studentUserId: req.body.studentUserId, classId: req.body.classId },
        { $set: { status: "active" } },
        { upsert: true, new: true },
      );
      res.status(201).json(e);
    } catch (e) {
      next(e);
    }
  },
);

router.delete(
  "/enrollments",
  body("studentUserId").isMongoId(),
  body("classId").isMongoId(),
  validate,
  async (req, res, next) => {
    try {
      await Enrollment.findOneAndUpdate(
        { studentUserId: req.body.studentUserId, classId: req.body.classId },
        { $set: { status: "dropped" } },
      );
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  },
);

/** Parent-child */
router.post(
  "/links/parent-child",
  body("parentUserId").isMongoId(),
  body("studentUserId").isMongoId(),
  validate,
  async (req, res, next) => {
    try {
      const [p, s] = await Promise.all([User.findById(req.body.parentUserId), User.findById(req.body.studentUserId)]);
      if (!p || p.role !== "parent") throw new AppError(400, "Invalid parent", "INVALID");
      if (!s || s.role !== "student") throw new AppError(400, "Invalid student", "INVALID");
      await ParentChildLink.findOneAndUpdate(
        { parentUserId: req.body.parentUserId, studentUserId: req.body.studentUserId },
        {},
        { upsert: true, new: true },
      );
      res.status(201).json({ ok: true });
    } catch (e) {
      next(e);
    }
  },
);

router.delete(
  "/links/parent-child",
  query("parentUserId").isMongoId(),
  query("studentUserId").isMongoId(),
  validate,
  async (req, res, next) => {
    try {
      await ParentChildLink.deleteOne({ parentUserId: req.query.parentUserId, studentUserId: req.query.studentUserId });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  },
);

/** Parent dashboard (admin view) */
router.get("/parents/:id/dashboard", param("id").isMongoId(), validate, async (req, res, next) => {
  try {
    const parentId = req.params.id;
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== "parent") throw new AppError(404, "Not found", "NOT_FOUND");

    const links = await ParentChildLink.find({ parentUserId: parentId }).lean();
    const childrenIds = links.map((l) => l.studentUserId);
    const [profiles, fees, grades, enrollments] = await Promise.all([
      StudentProfile.find({ userId: { $in: childrenIds } }).lean(),
      Fee.find({ studentUserId: { $in: childrenIds } }).lean(),
      GradebookEntry.find({ studentUserId: { $in: childrenIds } }).populate("classId").lean(),
      Enrollment.find({ studentUserId: { $in: childrenIds }, status: "active" }).populate("classId").lean(),
    ]);

    const profDoc = await ParentProfile.findOne({ userId: parentId }).lean();
    if (profDoc?.phone) profDoc.phone = decryptOptional(profDoc.phone);

    res.json({
      parent: {
        user: { id: parent._id, email: parent.email },
        profile: profDoc,
      },
      children: childrenIds.map((cid) => {
        const cidStr = String(cid);
        return {
          userId: cid,
          profile: profiles.find((p) => String(p.userId) === cidStr),
          enrollments: enrollments.filter((e) => String(e.studentUserId) === cidStr),
          fees: fees.filter((f) => String(f.studentUserId) === cidStr),
          grades: grades.filter((g) => String(g.studentUserId) === cidStr),
        };
      }),
    });
  } catch (e) {
    next(e);
  }
});

/** Final reports */
router.post(
  "/final-reports",
  body("studentUserId").isMongoId(),
  body("academicYear").isString(),
  body("summary").optional().isString(),
  body("pdfUrl").optional().isString(),
  validate,
  async (req, res, next) => {
    try {
      const r = await FinalReport.findOneAndUpdate(
        { studentUserId: req.body.studentUserId, academicYear: req.body.academicYear },
        { $set: { summary: req.body.summary, pdfUrl: req.body.pdfUrl, posted: false } },
        { upsert: true, new: true },
      );
      res.status(201).json(r);
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/final-reports/:id/publish",
  param("id").isMongoId(),
  validate,
  async (req, res, next) => {
    try {
      const r = await FinalReport.findByIdAndUpdate(
        req.params.id,
        { posted: true, postedAt: new Date(), postedByAdminId: req.user._id },
        { new: true },
      );
      if (!r) throw new AppError(404, "Not found", "NOT_FOUND");
      res.json(r);
    } catch (e) {
      next(e);
    }
  },
);

router.delete("/final-reports/:id", param("id").isMongoId(), validate, async (req, res, next) => {
  try {
    await FinalReport.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/** Fees */
router.post(
  "/fees",
  body("studentUserId").isMongoId(),
  body("amount").isFloat({ gt: 0 }),
  body("label").optional().isString(),
  body("dueDate").optional().isISO8601(),
  validate,
  async (req, res, next) => {
    try {
      const f = await Fee.create(req.body);
      res.status(201).json(f);
    } catch (e) {
      next(e);
    }
  },
);

router.patch("/fees/:id", param("id").isMongoId(), validate, async (req, res, next) => {
  try {
    const f = await Fee.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!f) throw new AppError(404, "Not found", "NOT_FOUND");
    res.json(f);
  } catch (e) {
    next(e);
  }
});

router.delete("/fees/:id", param("id").isMongoId(), validate, async (req, res, next) => {
  try {
    await Fee.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/** Materials moderation */
router.delete("/materials/:id", param("id").isMongoId(), validate, async (req, res, next) => {
  try {
    await Material.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/** Gradebook overrides (same shape as teacher) */
router.patch(
  "/grades",
  body("studentUserId").isMongoId(),
  body("classId").isMongoId(),
  body("academicTerm").optional().isString(),
  body("subject").optional().isString(),
  body("attendance").optional().isFloat({ min: 0, max: 100 }),
  body("classwork").optional().isFloat({ min: 0, max: 100 }),
  body("quiz").optional().isFloat({ min: 0, max: 100 }),
  body("midterm").optional().isFloat({ min: 0, max: 100 }),
  body("finalExam").optional().isFloat({ min: 0, max: 100 }),
  validate,
  async (req, res, next) => {
    try {
      const { studentUserId, classId, academicTerm = "", ...rest } = req.body;
      const row = await GradebookEntry.findOneAndUpdate(
        { studentUserId, classId, academicTerm },
        { $set: { ...rest, updatedBy: req.user._id } },
        { upsert: true, new: true },
      );
      res.json(row);
    } catch (e) {
      next(e);
    }
  },
);

/** System settings */
router.get("/settings", async (_req, res, next) => {
  try {
    const items = await SystemSetting.find({}).lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

router.put(
  "/settings/:key",
  param("key").isString(),
  body("value").exists(),
  validate,
  async (req, res, next) => {
    try {
      const row = await SystemSetting.findOneAndUpdate(
        { key: req.params.key },
        { $set: { value: req.body.value } },
        { upsert: true, new: true },
      );
      res.json(row);
    } catch (e) {
      next(e);
    }
  },
);

export default router;
