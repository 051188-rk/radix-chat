const express = require("express");
const authRoutes = require("./authRoutes");
const chatRoutes = require("./chatRoutes");
const profileRoutes = require("./profileRoutes");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
router.use("/auth", authRoutes);
router.use("/chats", authMiddleware, chatRoutes);
router.use("/profile", authMiddleware, profileRoutes);

module.exports = router;
