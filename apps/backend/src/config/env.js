const required = ["MONGO_URI", "JWT_SECRET"];

function ensureEnv(name, fallback = "") {
  return process.env[name] ?? fallback;
}

function validateEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}

module.exports = {
  env: {
    port: Number(ensureEnv("PORT", "4000")),
    mongoUri: ensureEnv("MONGO_URI"),
    jwtSecret: ensureEnv("JWT_SECRET"),
    jwtExpiresIn: ensureEnv("JWT_EXPIRES_IN", "7d"),
    clientOrigin: ensureEnv("CLIENT_ORIGIN", "http://localhost:4200"),
    grokApiKey: ensureEnv("GROK_API_KEY"),
    geminiApiKey: ensureEnv("GEMINI_API_KEY"),
    nimApiKey: ensureEnv("NVIDIA_NIM_API_KEY"),
    minimaxApiKey: ensureEnv("MINIMAX_API_KEY"),
    grokApiUrl: ensureEnv("GROK_API_URL", "https://api.x.ai/v1/chat/completions"),
    geminiApiUrl: ensureEnv(
      "GEMINI_API_URL",
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent"
    ),
    nimApiUrl: ensureEnv("NVIDIA_NIM_API_URL", "https://integrate.api.nvidia.com/v1/chat/completions"),
    minimaxApiUrl: ensureEnv("MINIMAX_API_URL", "https://api.minimax.chat/v1/text/chatcompletion_pro")
  },
  validateEnv
};
