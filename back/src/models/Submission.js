import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    fileUrl: { type: String, required: true },
    name: { type: String, default: "" },
  },
  { _id: false },
);

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
    studentUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    files: [fileSchema],
    status: { type: String, enum: ["submitted", "graded"], default: "submitted" },
    grade: { type: Number, default: null },
    feedback: { type: String, default: "" },
  },
  { timestamps: true, collection: "submissions" },
);

submissionSchema.index({ assignmentId: 1, studentUserId: 1 }, { unique: true });

export const Submission = mongoose.model("Submission", submissionSchema);
