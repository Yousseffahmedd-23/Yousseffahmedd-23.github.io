/**
 * Seeds MongoDB with demo users and related documents.
 *
 * Usage:
 *   npm run seed              — insert once if demo admin does not exist
 *   npm run seed -- --reset   — empties app collections then inserts fresh dummy data
 *
 * Login (after seed): demo-admin@school.local / DemoPass123!  (same for all demo users)
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { connectDb } from "../src/db.js";
import { ensureMongoCollections } from "../src/mongoCollections.js";
import "../src/models/registerAll.js";
import { hashPassword } from "../src/utils/password.js";
import { createProfileForNewUser } from "../src/services/profiles.js";

import { User } from "../src/models/User.js";
import { AdminProfile } from "../src/models/AdminProfile.js";
import { TeacherProfile } from "../src/models/TeacherProfile.js";
import { ParentProfile } from "../src/models/ParentProfile.js";
import { StudentProfile } from "../src/models/StudentProfile.js";
import { ClassModel } from "../src/models/Class.js";
import { ClassSchedule } from "../src/models/ClassSchedule.js";
import { Enrollment } from "../src/models/Enrollment.js";
import { ParentChildLink } from "../src/models/ParentChildLink.js";
import { GradebookEntry } from "../src/models/GradebookEntry.js";
import { FinalReport } from "../src/models/FinalReport.js";
import { Fee } from "../src/models/Fee.js";
import { PaymentRecord } from "../src/models/PaymentRecord.js";
import { Subscription } from "../src/models/Subscription.js";
import { Material } from "../src/models/Material.js";
import { ClassPost } from "../src/models/ClassPost.js";
import { Comment } from "../src/models/Comment.js";
import { Assignment } from "../src/models/Assignment.js";
import { Submission } from "../src/models/Submission.js";
import { Conversation } from "../src/models/Conversation.js";
import { ChatMessage } from "../src/models/ChatMessage.js";
import { SystemSetting } from "../src/models/SystemSetting.js";
import { PasswordResetToken } from "../src/models/PasswordResetToken.js";

const DEMO = {
  admin: { email: "demo-admin@school.local", firstName: "Alex", lastName: "Admin" },
  teacher: { email: "demo-teacher@school.local", firstName: "Taylor", lastName: "Teacher" },
  parent: { email: "demo-parent@school.local", firstName: "Pat", lastName: "Parent", phone: "+10000000001" },
  student: { email: "demo-student@school.local", firstName: "Sam", lastName: "Student", gradeLevel: "10" },
  password: "DemoPass123!",
};

const ACADEMIC_YEAR = "2025-2026";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function writeDemoUploadFiles() {
  const uploadsDir = path.join(__dirname, "../uploads");
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.writeFileSync(
    path.join(uploadsDir, "demo-ebook-placeholder.txt"),
    "Demo e-book placeholder. Upload a real file via POST /api/files.\n",
  );
  fs.writeFileSync(
    path.join(uploadsDir, "demo-submission-placeholder.txt"),
    "Demo student submission placeholder.\n",
  );
}

async function clearAllCollections() {
  const order = [
    ChatMessage,
    Conversation,
    Submission,
    Comment,
    ClassPost,
    Assignment,
    Material,
    GradebookEntry,
    Enrollment,
    Fee,
    PaymentRecord,
    Subscription,
    FinalReport,
    ParentChildLink,
    ClassSchedule,
    ClassModel,
    AdminProfile,
    TeacherProfile,
    ParentProfile,
    StudentProfile,
    PasswordResetToken,
    SystemSetting,
    User,
  ];
  for (const Model of order) {
    await Model.deleteMany({});
  }
  console.log("Cleared all app collections.");
}

async function ensureUser(role, { email, firstName, lastName, ...rest }) {
  let u = await User.findOne({ email });
  const passwordHash = await hashPassword(DEMO.password);
  if (!u) {
    u = await User.create({ email, passwordHash, role, isActive: true });
    await createProfileForNewUser(role, u._id, { firstName, lastName, ...rest });
  }
  return u;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Set MONGODB_URI in back/.env");
    process.exit(1);
  }

  const doReset = process.argv.includes("--reset");

  await connectDb(uri);
  console.log("Connected:", mongoose.connection.name);
  await ensureMongoCollections();
  writeDemoUploadFiles();

  if (doReset) {
    await clearAllCollections();
  } else {
    const exists = await User.findOne({ email: DEMO.admin.email });
    if (exists) {
      console.log("Demo data already present. Run: npm run seed -- --reset");
      await mongoose.connection.close();
      process.exit(0);
    }
  }

  const admin = await ensureUser("admin", DEMO.admin);
  const teacher = await ensureUser("teacher", {
    ...DEMO.teacher,
    subjects: ["Mathematics"],
    bio: "Demo math teacher",
  });
  const parent = await ensureUser("parent", DEMO.parent);
  const student = await ensureUser("student", DEMO.student);

  const cls = await ClassModel.create({
    name: "Math 101",
    subject: "Mathematics",
    gradeLevel: "10",
    academicYear: ACADEMIC_YEAR,
    teacherIds: [teacher._id],
    description: "Intro algebra (demo class)",
  });

  await ClassSchedule.create({
    classId: cls._id,
    title: "Fall schedule",
    slots: [
      { dayOfWeek: 1, startTime: "09:00", endTime: "10:00", room: "A-101" },
      { dayOfWeek: 3, startTime: "09:00", endTime: "10:00", room: "A-101" },
    ],
  });

  await Enrollment.findOneAndUpdate(
    { studentUserId: student._id, classId: cls._id },
    { $set: { status: "active" } },
    { upsert: true },
  );

  await ParentChildLink.findOneAndUpdate(
    { parentUserId: parent._id, studentUserId: student._id },
    {},
    { upsert: true },
  );

  await GradebookEntry.findOneAndUpdate(
    { studentUserId: student._id, classId: cls._id, academicTerm: "fall" },
    {
      $set: {
        subject: "Mathematics",
        attendance: 95,
        classwork: 88,
        quiz: 90,
        midterm: 85,
        finalExam: 92,
        weightedTotal: 89.5,
        updatedBy: teacher._id,
      },
    },
    { upsert: true },
  );

  await Fee.create({
    studentUserId: student._id,
    label: "Tuition — Term 1",
    amount: 500,
    currency: "USD",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    status: "unpaid",
  });

  await Subscription.findOneAndUpdate(
    { parentUserId: parent._id },
    {
      $set: {
        status: "active",
        planKey: "premium",
        activeUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      },
    },
    { upsert: true },
  );

  await SystemSetting.findOneAndUpdate(
    { key: "grade_weights" },
    {
      $set: {
        value: {
          attendance: 0.1,
          classwork: 0.2,
          quiz: 0.2,
          midterm: 0.25,
          finalExam: 0.25,
        },
      },
    },
    { upsert: true },
  );

  const material = await Material.create({
    classId: cls._id,
    title: "Demo textbook (chapter 1)",
    description: "Placeholder file URL",
    fileUrl: "/uploads/demo-ebook-placeholder.txt",
    kind: "ebook",
    uploadedBy: teacher._id,
  });

  const post = await ClassPost.create({
    classId: cls._id,
    authorId: teacher._id,
    body: "Welcome to Math 101. Check materials for the syllabus.",
    attachments: [],
  });

  await Comment.create({
    postId: post._id,
    authorId: teacher._id,
    body: "Office hours: Mon 3pm.",
  });

  const assignment = await Assignment.create({
    classId: cls._id,
    teacherUserId: teacher._id,
    title: "Problem Set 1",
    instructions: "Submit answers as PDF (use /api/files to upload).",
    dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    attachments: [],
  });

  await Submission.findOneAndUpdate(
    { assignmentId: assignment._id, studentUserId: student._id },
    {
      $set: {
        files: [{ fileUrl: "/uploads/demo-submission-placeholder.txt", name: "ps1.pdf" }],
        status: "submitted",
      },
    },
    { upsert: true },
  );

  await FinalReport.findOneAndUpdate(
    { studentUserId: student._id, academicYear: ACADEMIC_YEAR },
    {
      $set: {
        summary: "Sam finished the term with strong progress in Mathematics.",
        pdfUrl: "",
        posted: true,
        postedAt: new Date(),
        postedByAdminId: admin._id,
      },
    },
    { upsert: true },
  );

  const threadKey = `${parent._id}:${teacher._id}:${student._id}`;
  const conv = await Conversation.findOneAndUpdate(
    { threadKey },
    {
      $setOnInsert: {
        parentUserId: parent._id,
        teacherUserId: teacher._id,
        studentUserId: student._id,
        threadKey,
      },
    },
    { upsert: true, new: true },
  );

  await ChatMessage.create([
    { conversationId: conv._id, senderUserId: parent._id, body: "Hi, checking in on Sam's progress." },
    { conversationId: conv._id, senderUserId: teacher._id, body: "Sam is doing well—see latest grades." },
  ]);

  console.log(`
Seed complete.
Database: ${mongoose.connection.host} / ${mongoose.connection.name}

Demo logins (password for all): ${DEMO.password}
  Admin:   ${DEMO.admin.email}
  Teacher: ${DEMO.teacher.email}
  Parent:  ${DEMO.parent.email}
  Student: ${DEMO.student.email}

Sample class ID: ${cls._id}
Material ID: ${material._id}
`);

  await mongoose.connection.close();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  mongoose.connection.close().finally(() => process.exit(1));
});
