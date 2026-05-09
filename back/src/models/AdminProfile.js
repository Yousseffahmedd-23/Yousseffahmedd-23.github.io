import mongoose from "mongoose";

const adminProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    phone: { type: String, default: "" },
  },
  { timestamps: true, collection: "admin_profiles" },
);

export const AdminProfile = mongoose.model("AdminProfile", adminProfileSchema);
