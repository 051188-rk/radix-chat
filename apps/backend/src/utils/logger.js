function logInfo(message, meta) {
  console.log(`[INFO] ${message}`, meta ?? "");
}

function logError(message, error) {
  console.error(`[ERROR] ${message}`, error);
}

module.exports = { logInfo, logError };
