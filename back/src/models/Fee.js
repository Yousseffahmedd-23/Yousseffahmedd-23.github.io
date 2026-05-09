import mongoose from "mongoose";

const feeSchema = new mongoose.Schema(
  {
    studentUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    label: { type: String, default: "Tuition" },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    dueDate: { type: Date, default: null },
    status: { type: String, enum: ["unpaid", "partial", "paid"], default: "unpaid" },
  },
  { timestamps: true, collection: "fees" },
);

feeSchema.index({ studentUserId: 1 });

export const Fee = mongoose.model("Fee", feeSchema);
