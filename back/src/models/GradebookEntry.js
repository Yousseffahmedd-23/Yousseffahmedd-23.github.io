import mongoose from "mongoose";

const gradebookEntrySchema = new mongoose.Schema(
  {
    studentUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    subject: { type: String, default: "" },
    academicTerm: { type: String, default: "" },
    attendance: { type: Number, min: 0, max: 100, default: null },
    classwork: { type: Number, min: 0, max: 100, default: null },
    quiz: { type: Number, min: 0, max: 100, default: null },
    midterm: { type: Number, min: 0, max: 100, default: null },
    finalExam: { type: Number, min: 0, max: 100, default: null },
    weightedTotal: { type: Number, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, collection: "gradebook_entries" },
);

gradebookEntrySchema.index({ studentUserId: 1, classId: 1, academicTerm: 1 }, { unique: true });

export const GradebookEntry = mongoose.model("GradebookEntry", gradebookEntrySchema);
