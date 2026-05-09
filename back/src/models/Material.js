import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    fileUrl: { type: String, required: true },
    kind: { type: String, enum: ["ebook", "lecture", "other"], default: "other" },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, collection: "materials" },
);

materialSchema.index({ classId: 1 });

export const Material = mongoose.model("Material", materialSchema);
