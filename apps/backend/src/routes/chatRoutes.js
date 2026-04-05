const express = require("express");
const {
  createChatSession,
  listChats,
  getChat,
  removeChat,
  streamChat,
  cancelRequest
} = require("../controllers/chatController");
const { validate } = require("../middleware/validate");
const { createChatSchema, sendMessageSchema, chatIdParamsSchema, cancelSchema } = require("../validators/chatValidators");
const { chatRateLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.get("/", listChats);
router.post("/", validate(createChatSchema), createChatSession);
router.get("/:chatId", validate(chatIdParamsSchema), getChat);
router.delete("/:chatId", validate(chatIdParamsSchema), removeChat);
router.post("/:chatId/stream", chatRateLimiter, validate(sendMessageSchema), streamChat);
router.post("/:chatId/cancel/:requestId", validate(cancelSchema), cancelRequest);

module.exports = router;
