import { Router } from "express";
import { body, param, query, validationResult } from "express-validator";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { AppError } from "../utils/AppError.js";
import { ParentChildLink } from "../models/ParentChildLink.js";
import { Enrollment } from "../models/Enrollment.js";
import { GradebookEntry } from "../models/GradebookEntry.js";
import { FinalReport } from "../models/FinalReport.js";
import { Fee } from "../models/Fee.js";
import { PaymentRecord } from "../models/PaymentRecord.js";
import { Subscription } from "../models/Subscription.js";
import { Material } from "../models/Material.js";
import { ClassPost } from "../models/ClassPost.js";
import { Comment } from "../models/Comment.js";
import { ClassModel } from "../models/Class.js";
import { User } from "../models/User.js";
import { Conversation } from "../models/Conversation.js";
import { ChatMessage } from "../models/ChatMessage.js";
import crypto from "crypto";
import {
  parentLinksChild,
  parentSubscriptionActive,
  teacherTeachesClass,
  studentEnrolled,
} from "../services/access.js";
import { paginate as paginateQuery } from "../utils/pagination.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("parent"));

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

async function assertChild(parentId, studentId) {
  const ok = await parentLinksChild(parentId, studentId);
  if (!ok) throw new AppError(403, "Not your child", "FORBIDDEN");
}

router.get("/children", async (req, res, next) => {
  try {
    const links = await ParentChildLink.find({ parentUserId: req.user._id }).lean();
    const ids = links.map((l) => l.studentUserId);
    const users = await User.find({ _id: { $in: ids } }).lean();
    res.json({
      items: users.map((u) => ({ id: u._id, email: u.email })),
    });
  } catch (e) {
    next(e);
  }
});

router.get("/children/:studentId", param("studentId").isMongoId(), validate, async (req, res, next) => {
  try {
    await assertChild(req.user._id, req.params.studentId);
    const u = await User.findById(req.params.studentId);
    const enrollments = await Enrollment.find({ studentUserId: req.params.studentId, status: "active" }).populate("classId").lean();
    const fees = await Fee.find({ studentUserId: req.params.studentId }).lean();
    const grades = await GradebookEntry.find({ studentUserId: req.params.studentId }).populate("classId").lean();
    res.json({ user: u, enrollments, fees, grades });
  } catch (e) {
    next(e);
  }
});

router.get(
  "/children/:studentId/grades/by-subject",
  param("studentId").isMongoId(),
  validate,
  async (req, res, next) => {
    try {
      await assertChild(req.user._id, req.params.studentId);
      const grades = await GradebookEntry.find({ studentUserId: req.params.studentId }).populate("classId").lean();
      const bySubject = {};
      for (const g of grades) {
        const subj = g.subject || g.classId?.subject || g.classId?.name || "general";
        if (!bySubject[subj]) bySubject[subj] = [];
        bySubject[subj].push(g);
      }
      res.json({ studentUserId: req.params.studentId, bySubject });
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  "/children/:studentId/final-report",
  param("studentId").isMongoId(),
  query("academicYear").isString(),
  validate,
  async (req, res, next) => {
    try {
      await assertChild(req.user._id, req.params.studentId);
      const r = await FinalReport.findOne({
        studentUserId: req.params.studentId,
        academicYear: req.query.academicYear,
        posted: true,
      }).lean();
      if (!r) throw new AppError(404, "Report not posted", "NOT_FOUND");
      res.json(r);
    } catch (e) {
      next(e);
    }
  },
);

router.post("/subscription/mock-upgrade", async (req, res, next) => {
  try {
    const activeUntil = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    const s = await Subscription.findOneAndUpdate(
      { parentUserId: req.user._id },
      { $set: { status: "active", planKey: "premium", activeUntil } },
      { upsert: true, new: true },
    );
    res.json(s);
  } catch (e) {
    next(e);
  }
});

router.post("/subscription/mock-cancel", async (req, res, next) => {
  try {
    const s = await Subscription.findOneAndUpdate(
      { parentUserId: req.user._id },
      { $set: { status: "inactive", planKey: "free", activeUntil: null } },
      { upsert: true, new: true },
    );
    res.json(s);
  } catch (e) {
    next(e);
  }
});

router.get("/fees", async (req, res, next) => {
  try {
    const links = await ParentChildLink.find({ parentUserId: req.user._id }).lean();
    const ids = links.map((l) => l.studentUserId);
    const fees = await Fee.find({ studentUserId: { $in: ids } }).lean();
    res.json({ items: fees });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/fees/pay",
  body("feeIds").isArray({ min: 1 }),
  body("feeIds.*").isMongoId(),
  validate,
  async (req, res, next) => {
    try {
      const links = await ParentChildLink.find({ parentUserId: req.user._id }).lean();
      const childIds = new Set(links.map((l) => String(l.studentUserId)));

      const fees = await Fee.find({ _id: { $in: req.body.feeIds } });
      if (fees.length !== req.body.feeIds.length) throw new AppError(400, "Invalid fee id", "INVALID");

      for (const f of fees) {
        if (!childIds.has(String(f.studentUserId))) throw new AppError(403, "Fee not for your children", "FORBIDDEN");
        if (f.status === "paid") throw new AppError(400, "Already paid", "INVALID");
      }

      const amount = fees.reduce((a, f) => a + f.amount, 0);
      const mockGatewayRef = `mock_${crypto.randomBytes(8).toString("hex")}`;

      await Fee.updateMany({ _id: { $in: fees.map((f) => f._id) } }, { $set: { status: "paid" } });
      const pay = await PaymentRecord.create({
        parentUserId: req.user._id,
        feeIds: fees.map((f) => f._id),
        amount,
        mockGatewayRef,
        status: "succeeded",
      });

      res.json({ payment: pay });
    } catch (e) {
      next(e);
    }
  },
);

/** Class details: posts, comments, materials */
router.get(
  "/classes/:classId/details",
  param("classId").isMongoId(),
  query("studentUserId").isMongoId(),
  validate,
  async (req, res, next) => {
    try {
      const { studentUserId } = req.query;
      await assertChild(req.user._id, studentUserId);
      const enrolled = await studentEnrolled(studentUserId, req.params.classId);
      if (!enrolled) throw new AppError(403, "Child not enrolled", "FORBIDDEN");

      const [cls, materials, posts] = await Promise.all([
        ClassModel.findById(req.params.classId).lean(),
        Material.find({ classId: req.params.classId }).lean(),
        ClassPost.find({ classId: req.params.classId }).sort({ createdAt: -1 }).lean(),
      ]);
      const postIds = posts.map((p) => p._id);
      const comments = await Comment.find({ postId: { $in: postIds } }).sort({ createdAt: 1 }).lean();
      res.json({ class: cls, materials, posts, comments });
    } catch (e) {
      next(e);
    }
  },
);

/** Chat (REST) */
router.get("/chat/conversations", async (req, res, next) => {
  try {
    const items = await Conversation.find({ parentUserId: req.user._id }).lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/chat/conversations",
  body("teacherUserId").isMongoId(),
  body("studentUserId").isMongoId(),
  validate,
  async (req, res, next) => {
    try {
      const sub = await parentSubscriptionActive(req.user._id);
      if (!sub) throw new AppError(403, "Subscription required", "SUBSCRIPTION_REQUIRED");

      await assertChild(req.user._id, req.body.studentUserId);

      const shared = await findSharedClass(req.body.teacherUserId, req.body.studentUserId);
      if (!shared) throw new AppError(400, "Teacher does not teach this student", "INVALID");

      const threadKey = `${req.user._id}:${req.body.teacherUserId}:${req.body.studentUserId}`;
      const conv = await Conversation.findOneAndUpdate(
        { threadKey },
        {
          $setOnInsert: {
            parentUserId: req.user._id,
            teacherUserId: req.body.teacherUserId,
            studentUserId: req.body.studentUserId,
            threadKey,
          },
        },
        { upsert: true, new: true },
      );

      res.status(201).json(conv);
    } catch (e) {
      next(e);
    }
  },
);

async function findSharedClass(teacherUserId, studentUserId) {
  const enrolls = await Enrollment.find({ studentUserId, status: "active" }).select("classId");
  for (const en of enrolls) {
    if (await teacherTeachesClass(teacherUserId, en.classId)) return String(en.classId);
  }
  return null;
}

router.get(
  "/chat/conversations/:id/messages",
  param("id").isMongoId(),
  validate,
  async (req, res, next) => {
    try {
      const conv = await Conversation.findById(req.params.id);
      if (!conv || String(conv.parentUserId) !== String(req.user._id)) {
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
      const sub = await parentSubscriptionActive(req.user._id);
      if (!sub) throw new AppError(403, "Subscription required", "SUBSCRIPTION_REQUIRED");

      const conv = await Conversation.findById(req.params.id);
      if (!conv || String(conv.parentUserId) !== String(req.user._id)) {
        throw new AppError(404, "Not found", "NOT_FOUND");
      }

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

export default router;
