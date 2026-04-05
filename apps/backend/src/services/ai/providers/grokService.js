const { env } = require("../../../config/env");

class GrokService {
  constructor() {
    this.model = "grok";
  }

  async generate({ messages, signal }) {
    if (!env.grokApiKey) {
      return { text: `Grok fallback: ${messages.at(-1)?.content ?? ""}` };
    }

    const response = await fetch(env.grokApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.grokApiKey}`
      },
      body: JSON.stringify({ model: "grok-2-latest", messages, stream: false }),
      signal
    });

    if (!response.ok) {
      throw new Error(`Grok request failed (${response.status})`);
    }

    const json = await response.json();
    return { text: json.choices?.[0]?.message?.content ?? "" };
  }
}

module.exports = { GrokService };
