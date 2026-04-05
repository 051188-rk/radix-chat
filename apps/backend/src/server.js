require("dotenv").config();
const app = require("./app");
const { connectToDatabase } = require("./config/db");
const { env, validateEnv } = require("./config/env");
const { logInfo, logError } = require("./utils/logger");

async function startServer() {
  try {
    validateEnv();
    await connectToDatabase(env.mongoUri);
    app.listen(env.port, () => {
      logInfo(`Backend listening on http://localhost:${env.port}`);
    });
  } catch (error) {
    logError("Failed to start server", error);
    process.exit(1);
  }
}

startServer();
