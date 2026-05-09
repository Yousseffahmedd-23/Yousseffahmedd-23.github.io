import mongoose from "mongoose";
import { Enrollment } from "../models/Enrollment.js";
import { ClassModel } from "../models/Class.js";
import { ParentChildLink } from "../models/ParentChildLink.js";
import { Subscription } from "../models/Subscription.js";

export async function teacherTeachesClass(teacherUserId, classId) {
  const c = await ClassModel.findById(classId).select("teacherIds");
  return Boolean(c?.teacherIds?.some((id) => String(id) === String(teacherUserId)));
}

export async function studentEnrolled(studentUserId, classId, activeOnly = true) {
  const q = { studentUserId, classId: new mongoose.Types.ObjectId(classId) };
  if (activeOnly) q.status = "active";
  const e = await Enrollment.findOne(q);
  return Boolean(e);
}

export async function parentLinksChild(parentUserId, studentUserId) {
  const l = await ParentChildLink.findOne({ parentUserId, studentUserId });
  return Boolean(l);
}

export async function parentSubscriptionActive(parentUserId) {
  const s = await Subscription.findOne({ parentUserId });
  if (!s || s.status !== "active") return false;
  if (s.activeUntil && s.activeUntil < new Date()) return false;
  return true;
}

export async function enrollmentClassIds(studentUserId) {
  const rows = await Enrollment.find({ studentUserId, status: "active" }).select("classId");
  return rows.map((r) => String(r.classId));
}
