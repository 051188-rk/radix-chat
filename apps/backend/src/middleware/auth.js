const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Token expired or invalid" });
  }
}

module.exports = { authMiddleware };
