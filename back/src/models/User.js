import mongoose from "mongoose";

const roles = ["admin", "teacher", "parent", "student"];

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: roles, required: true },
    isActive: { type: Boolean, default: true },
    stripeCustomerId: { type: String, default: null },
  },
  { timestamps: true, collection: "users" },
);

export const User = mongoose.model("User", userSchema);
export const USER_ROLES = roles;
