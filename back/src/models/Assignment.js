import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    fileUrl: { type: String, required: true },
    name: { type: String, default: "" },
  },
  { _id: false },
);

const assignmentSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    teacherUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    instructions: { type: String, default: "" },
    dueAt: { type: Date, default: null },
    attachments: [attachmentSchema],
  },
  { timestamps: true, collection: "assignments" },
);

assignmentSchema.index({ classId: 1 });

export const Assignment = mongoose.model("Assignment", assignmentSchema);
