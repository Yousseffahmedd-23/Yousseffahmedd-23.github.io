import mongoose from "mongoose";

const teacherProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    phone: { type: String, default: "" },
    subjects: [{ type: String }],
    bio: { type: String, default: "" },
  },
  { timestamps: true, collection: "teacher_profiles" },
);

export const TeacherProfile = mongoose.model("TeacherProfile", teacherProfileSchema);
