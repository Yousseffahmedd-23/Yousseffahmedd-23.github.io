import mongoose from "mongoose";

const finalReportSchema = new mongoose.Schema(
  {
    studentUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    academicYear: { type: String, required: true },
    summary: { type: String, default: "" },
    pdfUrl: { type: String, default: "" },
    posted: { type: Boolean, default: false },
    postedAt: { type: Date, default: null },
    postedByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, collection: "final_reports" },
);

finalReportSchema.index({ studentUserId: 1, academicYear: 1 }, { unique: true });

export const FinalReport = mongoose.model("FinalReport", finalReportSchema);
