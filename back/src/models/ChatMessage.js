import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true },
  },
  { timestamps: true, collection: "chat_messages" },
);

chatMessageSchema.index({ conversationId: 1, createdAt: -1 });

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
