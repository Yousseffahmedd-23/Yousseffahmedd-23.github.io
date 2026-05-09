import mongoose from "mongoose";

const linkSchema = new mongoose.Schema(
  {
    parentUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    studentUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, collection: "parent_child_links" },
);

linkSchema.index({ parentUserId: 1, studentUserId: 1 }, { unique: true });

export const ParentChildLink = mongoose.model("ParentChildLink", linkSchema);
