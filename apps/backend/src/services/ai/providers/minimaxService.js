const { env } = require("../../../config/env");

class MinimaxService {
  constructor() {
    this.model = "minimax";
  }

  async generate({ messages, signal }) {
    if (!env.minimaxApiKey) {
      return { text: `MiniMax fallback: ${messages.at(-1)?.content ?? ""}` };
    }

    const response = await fetch(env.minimaxApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.minimaxApiKey}`
      },
      body: JSON.stringify({
        model: "MiniMax-Text-01",
        messages: messages,
        stream: false,
        temperature: 0.7,
        max_tokens: 4096,
        top_p: 0.95,
        skip_refiner: false,
        mask_sensitive_info: false
      }),
      signal
    });

    if (!response.ok) {
      throw new Error(`MiniMax request failed (${response.status}): ${response.statusText}`);
    }

    const json = await response.json();
    return { text: json.choices?.[0]?.message?.content ?? "" };
  }

  async *streamGenerate({ messages, signal }) {
    if (!env.minimaxApiKey) {
      yield `MiniMax fallback: ${messages.at(-1)?.content ?? ""}`;
      return;
    }

    const response = await fetch(env.minimaxApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.minimaxApiKey}`
      },
      body: JSON.stringify({
        model: "MiniMax-Text-01",
        messages: messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
        top_p: 0.95,
        skip_refiner: false,
        mask_sensitive_info: false
      }),
      signal
    });

    if (!response.ok) {
      throw new Error(`MiniMax streaming request failed (${response.status}): ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        if (signal?.aborted) {
          reader.cancel();
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                yield content;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

module.exports = { MinimaxService };
