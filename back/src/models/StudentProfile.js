import mongoose from "mongoose";

const studentProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    dateOfBirth: { type: Date, default: null },
    gradeLevel: { type: String, default: "" },
  },
  { timestamps: true, collection: "student_profiles" },
);

export const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);
