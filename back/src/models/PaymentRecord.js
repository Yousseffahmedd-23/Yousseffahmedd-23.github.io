import mongoose from "mongoose";

const paymentRecordSchema = new mongoose.Schema(
  {
    parentUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    feeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Fee" }],
    amount: { type: Number, required: true },
    mockGatewayRef: { type: String, default: "" },
    status: { type: String, enum: ["succeeded", "failed", "pending"], default: "succeeded" },
  },
  { timestamps: true, collection: "payment_records" },
);

export const PaymentRecord = mongoose.model("PaymentRecord", paymentRecordSchema);
