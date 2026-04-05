const express = require("express");
const { signup, login } = require("../controllers/authController");
const { validate } = require("../middleware/validate");
const { signupSchema, loginSchema } = require("../validators/authValidators");
const { authRateLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.post("/signup", authRateLimiter, validate(signupSchema), signup);
router.post("/login", authRateLimiter, validate(loginSchema), login);

module.exports = router;
