const { env } = require("../../../config/env");

function toGeminiContents(messages) {
  return messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }]
  }));
}

class GeminiService {
  constructor() {
    this.model = "gemini";
  }

  async generate({ messages, signal }) {
    if (!env.geminiApiKey) {
      return { text: `Gemini fallback: ${messages.at(-1)?.content ?? ""}` };
    }

    const url = `${env.geminiApiUrl}?alt=sse&key=${env.geminiApiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: toGeminiContents(messages) }),
      signal
    });

    if (!response.ok) {
      throw new Error(`Gemini request failed (${response.status})`);
    }

    const text = await response.text();
    return { text };
  }
}

module.exports = { GeminiService };
