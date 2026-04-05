const { logError } = require("../utils/logger");

function errorMiddleware(error, _req, res, _next) {
  logError("Unhandled error", error);
  return res.status(error.statusCode ?? 500).json({
    message: error.message ?? "Internal server error"
  });
}

module.exports = { errorMiddleware };
