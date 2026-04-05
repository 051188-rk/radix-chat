const { z } = require("zod");

const signupSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(40),
    email: z.string().email(),
    password: z.string().min(8).max(128)
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128)
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

module.exports = { signupSchema, loginSchema };
