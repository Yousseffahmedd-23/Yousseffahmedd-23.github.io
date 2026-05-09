import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    parentUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    planKey: { type: String, default: "free" },
    status: { type: String, enum: ["active", "inactive"], default: "inactive" },
    activeUntil: { type: Date, default: null },
  },
  { timestamps: true, collection: "subscriptions" },
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
