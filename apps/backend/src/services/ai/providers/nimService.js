const { env } = require("../../../config/env");

class NimService {
  constructor() {
    this.model = "nim";
  }

  async generate({ messages, signal }) {
    if (!env.nimApiKey) {
      return { text: `NIM fallback: ${messages.at(-1)?.content ?? ""}` };
    }

    const response = await fetch(env.nimApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.nimApiKey}`
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-70b-instruct",
        stream: false,
        messages
      }),
      signal
    });

    if (!response.ok) {
      throw new Error(`NIM request failed (${response.status})`);
    }

    const json = await response.json();
    return { text: json.choices?.[0]?.message?.content ?? "" };
  }
}

module.exports = { NimService };
