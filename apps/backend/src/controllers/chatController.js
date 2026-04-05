const { randomUUID } = require("crypto");
const {
  createChat,
  getChatsForUser,
  getChatById,
  deleteChat,
  appendUserMessage,
  appendAssistantMessage
} = require("../services/chatService");
const { streamWithModel } = require("../services/ai/modelRegistry");

const activeRequests = new Map();

async function createChatSession(req, res, next) {
  try {
    const { model } = req.validated.body;
    const chat = await createChat(req.user.id, model);
    return res.status(201).json(chat);
  } catch (error) {
    return next(error);
  }
}

async function listChats(req, res, next) {
  try {
    const chats = await getChatsForUser(req.user.id);
    return res.status(200).json(chats);
  } catch (error) {
    return next(error);
  }
}

async function getChat(req, res, next) {
  try {
    const chat = await getChatById(req.user.id, req.validated.params.chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    return res.status(200).json(chat);
  } catch (error) {
    return next(error);
  }
}

async function removeChat(req, res, next) {
  try {
    const deleted = await deleteChat(req.user.id, req.validated.params.chatId);
    if (!deleted) {
      return res.status(404).json({ message: "Chat not found" });
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

async function streamChat(req, res, next) {
  const { chatId } = req.validated.params;
  const { content, model } = req.validated.body;
  const requestId = req.headers["x-request-id"] || randomUUID();
  const abortController = new AbortController();
  const activeKey = `${req.user.id}:${chatId}:${requestId}`;
  activeRequests.set(activeKey, abortController);

  try {
    const chat = await appendUserMessage({ userId: req.user.id, chatId, content, model });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    res.write(`event: meta\ndata: ${JSON.stringify({ requestId })}\n\n`);

    const history = chat.messages.map((message) => ({
      role: message.role,
      content: message.content
    }));

    let fullAssistantText = "";
    for await (const token of streamWithModel({
      model,
      messages: history,
      signal: abortController.signal
    })) {
      fullAssistantText += token;
      res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
    }

    if (!abortController.signal.aborted) {
      await appendAssistantMessage({
        userId: req.user.id,
        chatId,
        content: fullAssistantText,
        model
      });
      res.write("event: done\ndata: {}\n\n");
    } else {
      res.write("event: cancelled\ndata: {}\n\n");
    }
    res.end();
  } catch (error) {
    if (!res.headersSent) {
      return next(error);
    }
    res.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`);
    res.end();
  } finally {
    activeRequests.delete(activeKey);
  }
}

async function cancelRequest(req, res) {
  const { chatId, requestId } = req.validated.params;
  const key = `${req.user.id}:${chatId}:${requestId}`;
  const controller = activeRequests.get(key);
  if (!controller) {
    return res.status(404).json({ message: "Request not found or already completed" });
  }
  controller.abort();
  activeRequests.delete(key);
  return res.status(200).json({ message: "Request cancelled" });
}

module.exports = { createChatSession, listChats, getChat, removeChat, streamChat, cancelRequest };
