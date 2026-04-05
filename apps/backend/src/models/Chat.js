const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true, trim: true },
    model: { type: String, enum: ["grok", "gemini", "nim"], required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { _id: false }
);

const chatSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "New Chat", trim: true, maxlength: 150 },
    selectedModel: { type: String, enum: ["grok", "gemini", "nim"], default: "gemini", index: true },
    messages: { type: [messageSchema], default: [] }
  },
  { timestamps: true }
);

chatSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model("Chat", chatSchema);
