const OpenAI = require("openai");
const math = require("mathjs");

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  normalizeL2(vector) {
    const norm = math.norm(vector);
    return norm === 0 ? vector : math.divide(vector, norm);
  }

  async generateEmbedding(text, dimensions = 256) {
    try {
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        dimensions: dimensions,
        encoding_format: "float",
      });
      const embedding = response.data[0].embedding;
      return this.normalizeL2(embedding);
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw error;
    }
  }

  async generateResponse(messageHistory) {
    try {
      // Convert message history to a string, replacing newlines with spaces
      const historyText = messageHistory
        .map((msg) => `${msg.role}: ${msg.content.replace(/\n/g, " ")}`)
        .join(" ");

      // Generate embedding for the history
      const historyEmbedding = await this.generateEmbedding(historyText);

      // Convert embedding to base64 string
      const historyEmbeddingBase64 = Buffer.from(
        historyEmbedding.buffer
      ).toString("base64");

      // Use the embedding in your chat completion
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant in a Discord server. Use the provided message history and embeddings for context.",
          },
          ...messageHistory,
          {
            role: "system",
            content: `History Embedding: ${historyEmbeddingBase64}`,
          },
        ],
        max_tokens: 150,
      });
      return response.choices[0].message.content;
    } catch (error) {
      console.error("Error with OpenAI API:", error);
      throw error;
    }
  }
}

module.exports = OpenAIService;