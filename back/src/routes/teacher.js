import { Router } from "express";
import { body, param, validationResult } from "express-validator";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { AppError } from "../utils/AppError.js";
import { ClassModel } from "../models/Class.js";
import { Enrollment } from "../models/Enrollment.js";
import { GradebookEntry } from "../models/GradebookEntry.js";
import { Material } from "../models/Material.js";
import { ClassPost } from "../models/ClassPost.js";
import { Comment } from "../models/Comment.js";
import { Assignment } from "../models/Assignment.js";
import { Submission } from "../models/Submission.js";
import { Conversation } from "../models/Conversation.js";
import { ChatMessage } from "../models/ChatMessage.js";
import { User } from "../models/User.js";
import { teacherTeachesClass, parentSubscriptionActive, parentLinksChild } from "../services/access.js";
import { paginate as paginateQuery } from "../utils/pagination.js";
import { SystemSetting } from "../models/SystemSetting.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("teacher"));

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

async function assertTeaches(teacherId, classId) {
  const ok = await teacherTeachesClass(teacherId, classId);
  if (!ok) throw new AppError(403, "Not assigned to this class", "FORBIDDEN");
}

async function defaultWeights() {
  const row = await SystemSetting.findOne({ key: "grade_weights" }).lean();
  return (
    row?.value ?? {
      attendance: 0.1,
      classwork: 0.2,
      quiz: 0.2,
      midterm: 0.25,
      finalExam: 0.25,
    }
  );
}

function computeWeighted(g, w) {
  let num = 0;
  let den = 0;
  if (g.attendance != null) {
    num += g.attendance * w.attendance;
    den += w.attendance;
  }
  if (g.classwork != null) {
    num += g.classwork * w.classwork;
    den += w.classwork;
  }
  if (g.quiz != null) {
    num += g.quiz * w.quiz;
    den += w.quiz;
  }
  if (g.midterm != null) {
    num += g.midterm * w.midterm;
    den += w.midterm;
  }
  if (g.finalExam != null) {
    num += g.finalExam * w.finalExam;
    den += w.finalExam;
  }
  if (den <= 0) return null;
  return Math.round((num / den) * 100) / 100;
}

router.get("/classes", async (req, res, next) => {
  try {
    const classes = await ClassModel.find({ teacherIds: req.user._id }).sort({ name: 1 }).lean();
    res.json({ items: classes });
  } catch (e) {
    next(e);
  }
});

router.get("/classes/:classId/students", param("classId").isMongoId(), validate, async (req, res, next) => {
  try {
    await assertTeaches(req.user._id, req.params.classId);
    const enrolls = await Enrollment.find({ classId: req.params.classId, status: "active" }).lean();
    const ids = enrolls.map((e) => e.studentUserId);
    const users = await User.find({ _id: { $in: ids } }).lean();
    res.json({ items: users });
  } catch (e) {
    next(e);
  }
});

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
      const { studentUserId, classId, academicTerm = "", subject, ...rest } = req.body;
      await assertTeaches(req.user._id, classId);
      const enrolled = await Enrollment.findOne({ studentUserId, classId, status: "active" });
      if (!enrolled) throw new AppError(400, "Student not enrolled", "INVALID");

      const cls = await ClassModel.findById(classId);
      const subj = subject ?? cls?.subject ?? "";

      const w = await defaultWeights();
      const patch = { ...rest, subject: subj, updatedBy: req.user._id };
      const row = await GradebookEntry.findOneAndUpdate(
        { studentUserId, classId, academicTerm },
        { $set: patch },
        { upsert: true, new: true },
      );

      row.weightedTotal = computeWeighted(row, w);
      await row.save();

      res.json(row);
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/classes/:classId/materials",
  param("classId").isMongoId(),
  body("title").isString(),
  body("fileUrl").isString(),
  body("kind").optional().isIn(["ebook", "lecture", "other"]),
  body("description").optional().isString(),
  validate,
  async (req, res, next) => {
    try {
      await assertTeaches(req.user._id, req.params.classId);
      const m = await Material.create({
        classId: req.params.classId,
        title: req.body.title,
        fileUrl: req.body.fileUrl,
        kind: req.body.kind ?? "other",
        description: req.body.description ?? "",
        uploadedBy: req.user._id,
      });
      res.status(201).json(m);
    } catch (e) {
      next(e);
    }
  },
);

router.patch("/materials/:id", param("id").isMongoId(), validate, async (req, res, next) => {
  try {
    const m = await Material.findById(req.params.id);
    if (!m) throw new AppError(404, "Not found", "NOT_FOUND");
    await assertTeaches(req.user._id, m.classId);
    Object.assign(m, req.body);
    await m.save();
    res.json(m);
  } catch (e) {
    next(e);
  }
});

router.delete("/materials/:id", param("id").isMongoId(), validate, async (req, res, next) => {
  try {
    const m = await Material.findById(req.params.id);
    if (!m) throw new AppError(404, "Not found", "NOT_FOUND");
    await assertTeaches(req.user._id, m.classId);
    await m.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/classes/:classId/posts",
  param("classId").isMongoId(),
  body("body").optional().isString(),
  body("attachments").optional().isArray(),
  validate,
  async (req, res, next) => {
    try {
      await assertTeaches(req.user._id, req.params.classId);
      const p = await ClassPost.create({
        classId: req.params.classId,
        authorId: req.user._id,
        body: req.body.body ?? "",
        attachments: req.body.attachments ?? [],
      });
      res.status(201).json(p);
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/posts/:postId/comments",
  param("postId").isMongoId(),
  body("body").isString(),
  validate,
  async (req, res, next) => {
    try {
      const post = await ClassPost.findById(req.params.postId);
      if (!post) throw new AppError(404, "Not found", "NOT_FOUND");
      await assertTeaches(req.user._id, post.classId);
      const c = await Comment.create({ postId: post._id, authorId: req.user._id, body: req.body.body });
      res.status(201).json(c);
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/classes/:classId/assignments",
  param("classId").isMongoId(),
  body("title").isString(),
  body("instructions").optional().isString(),
  body("dueAt").optional().isISO8601(),
  body("attachments").optional().isArray(),
  validate,
  async (req, res, next) => {
    try {
      await assertTeaches(req.user._id, req.params.classId);
      const a = await Assignment.create({
        classId: req.params.classId,
        teacherUserId: req.user._id,
        title: req.body.title,
        instructions: req.body.instructions ?? "",
        dueAt: req.body.dueAt ?? null,
        attachments: req.body.attachments ?? [],
      });
      res.status(201).json(a);
    } catch (e) {
      next(e);
    }
  },
);

/** Chat: teacher side */
router.get("/chat/conversations", async (req, res, next) => {
  try {
    const items = await Conversation.find({ teacherUserId: req.user._id }).lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

router.get(
  "/chat/conversations/:id/messages",
  param("id").isMongoId(),
  validate,
  async (req, res, next) => {
    try {
      const conv = await Conversation.findById(req.params.id);
      if (!conv || String(conv.teacherUserId) !== String(req.user._id)) {
        throw new AppError(404, "Not found", "NOT_FOUND");
      }
      const { limit, skip } = paginateQuery(req.query);
      const [items, total] = await Promise.all([
        ChatMessage.find({ conversationId: conv._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        ChatMessage.countDocuments({ conversationId: conv._id }),
      ]);
      res.json({ items, total });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/chat/conversations/:id/messages",
  param("id").isMongoId(),
  body("body").isString().isLength({ min: 1 }),
  validate,
  async (req, res, next) => {
    try {
      const conv = await Conversation.findById(req.params.id);
      if (!conv || String(conv.teacherUserId) !== String(req.user._id)) {
        throw new AppError(404, "Not found", "NOT_FOUND");
      }

      const sub = await parentSubscriptionActive(conv.parentUserId);
      if (!sub) throw new AppError(403, "Parent subscription inactive", "SUBSCRIPTION_REQUIRED");

      const linked = await parentLinksChild(conv.parentUserId, conv.studentUserId);
      if (!linked) throw new AppError(403, "Invalid conversation", "FORBIDDEN");

      const cid = await classIdForStudentTeacher(conv.studentUserId, req.user._id);
      if (!cid) throw new AppError(403, "Not eligible", "FORBIDDEN");

      const msg = await ChatMessage.create({
        conversationId: conv._id,
        senderUserId: req.user._id,
        body: req.body.body,
      });
      res.status(201).json(msg);
    } catch (e) {
      next(e);
    }
  },
);

async function classIdForStudentTeacher(studentUserId, teacherUserId) {
  const enrolls = await Enrollment.find({ studentUserId, status: "active" }).select("classId");
  for (const en of enrolls) {
    if (await teacherTeachesClass(teacherUserId, en.classId)) return en.classId;
  }
  return null;
}

export default router;
