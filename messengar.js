require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Generates a WhatsApp reply using Gemini
 * @param {string} userMessage - Incoming user message
 * @param {string[]} history - Last 3-4 messages from the user
 * @returns {Promise<{reply: string, context: string}>}
 */
async function generateReplyFromGemini(userMessage, history = []) {
  const prompt = `
You are *KartavyaBot*, a professional WhatsApp chatbot for KartavyaAI, a company that builds AI and web solutions for clients.

Reply professionally to the following user message. Do not mention that you're an AI. Keep it human, helpful, and concise.

Context: ${history.join("\n")}
User message: "${userMessage}"

Respond in this JSON format:
{
  "reply": "your response",
  "context": "summarized context"
}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    console.log("🔵 Raw Gemini response:\n", text);

    // Attempt to extract JSON block using regex
    const jsonMatch = text.match(/```json([\s\S]*?)```|({[\s\S]*})/);
    let json;

    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[2]; // extract clean JSON part
      json = JSON.parse(jsonStr.trim());
    } else {
      console.warn("⚠️ No JSON found in Gemini response. Falling back.");
      json = { reply: text, context: history.join("\n") };
    }

    console.log("✅ Parsed reply JSON:", json);

    return {
      reply: json.reply || "I'm here to help you with KartavyaAI services.",
      context: json.context || history.join("\n"),
    };

  } catch (err) {
    console.error("❌ Gemini parsing error:", err.message);
    return {
      reply: "Sorry, I couldn't understand that. Could you try again?",
      context: history.join("\n"),
    };
  }
}

module.exports = { generateReplyFromGemini };
