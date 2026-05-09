import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    fileUrl: { type: String, required: true },
    name: { type: String, default: "" },
  },
  { _id: false },
);

const classPostSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, default: "" },
    attachments: [attachmentSchema],
  },
  { timestamps: true, collection: "class_posts" },
);

classPostSchema.index({ classId: 1, createdAt: -1 });

export const ClassPost = mongoose.model("ClassPost", classPostSchema);
