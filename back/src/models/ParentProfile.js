import mongoose from "mongoose";

const parentProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
  },
  { timestamps: true, collection: "parent_profiles" },
);

export const ParentProfile = mongoose.model("ParentProfile", parentProfileSchema);
