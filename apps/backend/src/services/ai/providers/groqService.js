const { Groq } = require('groq-sdk');
const { env } = require("../../../config/env");

class GroqService {
  constructor() {
    this.model = "groq";
    this.groq = new Groq({
      apiKey: env.groqApiKey || process.env.GROQ_API_KEY
    });
  }

  async generate({ messages, signal }) {
    if (!env.groqApiKey) {
      return { text: `Groq fallback: ${messages.at(-1)?.content ?? ""}` };
    }

    try {
      const chatCompletion = await this.groq.chat.completions.create({
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        model: "llama-3.3-70b-versatile",
        temperature: 1,
        max_completion_tokens: 8192,
        top_p: 1,
        stream: false,
        stop: null
      }, {
        signal
      });

      return { 
        text: chatCompletion.choices[0]?.message?.content || ""
      };
    } catch (error) {
      console.error('Groq API error:', error);
      throw new Error(`Groq request failed: ${error.message}`);
    }
  }

  async *streamGenerate({ messages, signal }) {
    if (!env.groqApiKey) {
      yield `Groq fallback: ${messages.at(-1)?.content ?? ""}`;
      return;
    }

    try {
      const chatCompletion = await this.groq.chat.completions.create({
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        model: "llama-3.3-70b-versatile",
        temperature: 1,
        max_completion_tokens: 8192,
        top_p: 1,
        stream: true,
        stop: null
      }, {
        signal
      });

      for await (const chunk of chatCompletion) {
        if (signal?.aborted) {
          break;
        }
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error('Groq streaming error:', error);
      throw new Error(`Groq streaming failed: ${error.message}`);
    }
  }
}

module.exports = { GroqService };
