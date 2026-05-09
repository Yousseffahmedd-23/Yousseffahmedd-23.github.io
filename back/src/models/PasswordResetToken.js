import mongoose from "mongoose";

const passwordResetTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "password_reset_tokens" },
);

passwordResetTokenSchema.index({ userId: 1 });

export const PasswordResetToken = mongoose.model("PasswordResetToken", passwordResetTokenSchema);
