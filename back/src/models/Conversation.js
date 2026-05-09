import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    parentUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    teacherUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    /** Child context for eligibility checks (required for new threads). */
    studentUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    threadKey: { type: String, required: true, unique: true },
  },
  { timestamps: true, collection: "conversations" },
);

conversationSchema.index({ parentUserId: 1, teacherUserId: 1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);
