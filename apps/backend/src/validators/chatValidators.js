const { z } = require("zod");

const modelSchema = z.enum(["grok", "gemini", "nim"]);

const createChatSchema = z.object({
  body: z.object({
    model: modelSchema.default("gemini")
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const sendMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(12000),
    model: modelSchema
  }),
  params: z.object({
    chatId: z.string().min(1)
  }),
  query: z.object({}).optional()
});

const chatIdParamsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    chatId: z.string().min(1)
  }),
  query: z.object({}).optional()
});

const cancelSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    chatId: z.string().min(1),
    requestId: z.string().min(1)
  }),
  query: z.object({}).optional()
});

module.exports = { createChatSchema, sendMessageSchema, chatIdParamsSchema, cancelSchema };
