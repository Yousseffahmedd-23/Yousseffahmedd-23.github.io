import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    subject: { type: String, default: "" },
    gradeLevel: { type: String, default: "" },
    academicYear: { type: String, default: "" },
    teacherIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    description: { type: String, default: "" },
  },
  { timestamps: true, collection: "classes" },
);

export const ClassModel = mongoose.model("Class", classSchema);
