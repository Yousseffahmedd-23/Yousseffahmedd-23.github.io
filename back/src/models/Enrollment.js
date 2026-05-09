import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    studentUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    status: { type: String, enum: ["active", "dropped"], default: "active" },
  },
  { timestamps: true, collection: "enrollments" },
);

enrollmentSchema.index({ classId: 1, studentUserId: 1 }, { unique: true, partialFilterExpression: { status: "active" } });

export const Enrollment = mongoose.model("Enrollment", enrollmentSchema);
