const { GroqService } = require("./providers/groqService");
const { GrokService } = require("./providers/grokService");
const { GeminiService } = require("./providers/geminiService");
const { NimService } = require("./providers/nimService");

const providers = {
  groq: new GroqService(),
  grok: new GrokService(),
  gemini: new GeminiService(),
  nim: new NimService()
};

function splitIntoChunks(text) {
  const parts = [];
  const chunkSize = 12;
  for (let index = 0; index < text.length; index += chunkSize) {
    parts.push(text.slice(index, index + chunkSize));
  }
  return parts;
}

async function generateWithModel({ model, messages, signal }) {
  const provider = providers[model] ?? providers.gemini;
  const response = await provider.generate({ messages, signal });
  return {
    model,
    content: response.text ?? ""
  };
}

async function *streamWithModel({ model, messages, signal }) {
  const provider = providers[model] ?? providers.gemini;
  
  // Check if provider has streaming capability
  if (typeof provider.streamGenerate === 'function') {
    for await (const token of provider.streamGenerate({ messages, signal })) {
      if (signal?.aborted) {
        break;
      }
      yield token;
    }
  } else {
    // Fallback to non-streaming
    const normalized = await generateWithModel({ model, messages, signal });
    for (const token of splitIntoChunks(normalized.content)) {
      if (signal?.aborted) {
        break;
      }
      yield token;
    }
  }
}

module.exports = { generateWithModel, streamWithModel };
