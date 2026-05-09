import { Router } from "express";
import { body, param, query, validationResult } from "express-validator";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { AppError } from "../utils/AppError.js";
import { Enrollment } from "../models/Enrollment.js";
import { ClassModel } from "../models/Class.js";
import { GradebookEntry } from "../models/GradebookEntry.js";
import { FinalReport } from "../models/FinalReport.js";
import { Material } from "../models/Material.js";
import { ClassPost } from "../models/ClassPost.js";
import { Comment } from "../models/Comment.js";
import { Assignment } from "../models/Assignment.js";
import { Submission } from "../models/Submission.js";
import { enrollmentClassIds, studentEnrolled } from "../services/access.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("student"));

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

router.get("/classes", async (req, res, next) => {
  try {
    const enrolls = await Enrollment.find({ studentUserId: req.user._id, status: "active" }).populate("classId").lean();
    res.json({ items: enrolls });
  } catch (e) {
    next(e);
  }
});

router.get(
  "/classes/:classId/overview",
  param("classId").isMongoId(),
  validate,
  async (req, res, next) => {
    try {
      if (!(await studentEnrolled(req.user._id, req.params.classId))) {
        throw new AppError(403, "Not enrolled", "FORBIDDEN");
      }
      const [cls, materials, posts] = await Promise.all([
        ClassModel.findById(req.params.classId).lean(),
        Material.find({ classId: req.params.classId }).lean(),
        ClassPost.find({ classId: req.params.classId }).sort({ createdAt: -1 }).lean(),
      ]);
      const postIds = posts.map((p) => p._id);
      const comments = await Comment.find({ postId: { $in: postIds } }).sort({ createdAt: 1 }).lean();
      const assignments = await Assignment.find({ classId: req.params.classId }).sort({ dueAt: 1 }).lean();
      const subs = await Submission.find({
        assignmentId: { $in: assignments.map((a) => a._id) },
        studentUserId: req.user._id,
      }).lean();

      res.json({ class: cls, materials, posts, comments, assignments, submissions: subs });
    } catch (e) {
      next(e);
    }
  },
);

router.get("/grades", async (req, res, next) => {
  try {
    const grades = await GradebookEntry.find({ studentUserId: req.user._id }).populate("classId").lean();
    res.json({ items: grades });
  } catch (e) {
    next(e);
  }
});

router.get(
  "/subjects/:subject",
  param("subject").isString(),
  validate,
  async (req, res, next) => {
    try {
      const grades = await GradebookEntry.find({ studentUserId: req.user._id }).populate("classId").lean();
      const subject = decodeURIComponent(req.params.subject);
      const filtered = grades.filter((g) => (g.subject || g.classId?.subject || g.classId?.name) === subject);
      const classIds = [...new Set(filtered.map((g) => String(g.classId?._id)).filter(Boolean))];
      const materials = classIds.length
        ? await Material.find({ classId: { $in: classIds } }).lean()
        : [];
      res.json({ subject, grades: filtered, materials });
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  "/final-report",
  query("academicYear").isString(),
  validate,
  async (req, res, next) => {
    try {
      const r = await FinalReport.findOne({
        studentUserId: req.user._id,
        academicYear: req.query.academicYear,
        posted: true,
      }).lean();
      if (!r) throw new AppError(404, "Not posted", "NOT_FOUND");
      res.json(r);
    } catch (e) {
      next(e);
    }
  },
);

router.get("/assignments", async (req, res, next) => {
  try {
    const ids = await enrollmentClassIds(req.user._id);
    const items = await Assignment.find({ classId: { $in: ids } }).sort({ dueAt: -1 }).lean();
    const subIds = items.map((a) => a._id);
    const subs = await Submission.find({ assignmentId: { $in: subIds }, studentUserId: req.user._id }).lean();
    res.json({
      items: items.map((a) => ({
        assignment: a,
        submission: subs.find((s) => String(s.assignmentId) === String(a._id)) ?? null,
      })),
    });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/assignments/:assignmentId/submit",
  param("assignmentId").isMongoId(),
  body("files").isArray({ min: 1 }),
  body("files.*.fileUrl").isString(),
  body("files.*.name").optional().isString(),
  validate,
  async (req, res, next) => {
    try {
      const a = await Assignment.findById(req.params.assignmentId);
      if (!a) throw new AppError(404, "Not found", "NOT_FOUND");
      const ok = await studentEnrolled(req.user._id, a.classId);
      if (!ok) throw new AppError(403, "Forbidden", "FORBIDDEN");

      const sub = await Submission.findOneAndUpdate(
        { assignmentId: a._id, studentUserId: req.user._id },
        {
          $set: {
            files: req.body.files,
            status: "submitted",
          },
        },
        { upsert: true, new: true },
      );

      res.status(201).json(sub);
    } catch (e) {
      next(e);
    }
  },
);

export default router;
