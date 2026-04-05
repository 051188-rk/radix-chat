const mongoose = require("mongoose");
const Chat = require("../models/Chat");
const User = require("../models/User");

async function createChat(userId, model) {
  const chat = await Chat.create({
    userId,
    selectedModel: model,
    messages: []
  });
  return chat;
}

async function getChatsForUser(userId) {
  return Chat.find({ userId })
    .sort({ updatedAt: -1 })
    .select("_id title selectedModel updatedAt createdAt messages")
    .lean();
}

async function getChatById(userId, chatId) {
  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    return null;
  }
  return Chat.findOne({ _id: chatId, userId }).lean();
}

async function deleteChat(userId, chatId) {
  const deleted = await Chat.findOneAndDelete({ _id: chatId, userId });
  return Boolean(deleted);
}

async function appendUserMessage({ userId, chatId, content, model }) {
  const chat = await Chat.findOne({ _id: chatId, userId });
  if (!chat) {
    const error = new Error("Chat not found");
    error.statusCode = 404;
    throw error;
  }

  chat.selectedModel = model;
  chat.messages.push({ role: "user", content, model });

  if (chat.messages.length === 1) {
    chat.title = content.slice(0, 60);
  }

  await chat.save();
  return chat;
}

async function appendAssistantMessage({ userId, chatId, content, model }) {
  const chat = await Chat.findOne({ _id: chatId, userId });
  if (!chat) {
    return null;
  }

  chat.messages.push({ role: "assistant", content, model });
  await chat.save();
  return chat;
}

async function getProfileStats(userId) {
  const [user, totalChats, chatAgg] = await Promise.all([
    User.findById(userId).select("username email createdAt").lean(),
    Chat.countDocuments({ userId }),
    Chat.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $project: { messageCount: { $size: "$messages" } } },
      { $group: { _id: null, messages: { $sum: "$messageCount" } } }
    ])
  ]);

  return {
    user,
    stats: {
      totalChats,
      totalMessages: chatAgg[0]?.messages ?? 0
    }
  };
}

module.exports = {
  createChat,
  getChatsForUser,
  getChatById,
  deleteChat,
  appendUserMessage,
  appendAssistantMessage,
  getProfileStats
};
