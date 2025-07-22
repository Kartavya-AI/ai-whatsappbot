require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Processes voice message directly with Gemini (no transcription)
 * @param {Buffer} audioBuffer - Audio file buffer
 * @param {string} mimeType - MIME type of the audio file
 * @param {string[]} history - Chat history for context
 * @returns {Promise<{reply: string, context: string}>}
 */
async function processVoiceWithGemini(audioBuffer, mimeType = "audio/ogg", history = []) {
  try {
    console.log("🎙️ Processing voice message directly with Gemini...");
    
    const audioPart = {
      inlineData: {
        data: audioBuffer.toString('base64'),
        mimeType: mimeType
      }
    };

    const prompt = `
You are *KartavyaBot*, a professional WhatsApp chatbot for KartavyaAI, a company that builds AI and web solutions for clients.

Listen to this voice message and respond professionally to the user's question/request. Do not mention that you're an AI. Keep it human, helpful, and concise.

Context from previous messages: ${history.join("\n")}

Please respond in this JSON format:
{
  "reply": "your response to their voice message",
  "context": "summarized context"
}
`;
    
    const result = await model.generateContent([prompt, audioPart]);
    const text = result.response.text().trim();
    console.log("🔵 Raw Gemini voice response:\n", text);

    // Attempt to extract JSON block using regex
    const jsonMatch = text.match(/```json([\s\S]*?)```|({[\s\S]*})/);
    let json;

    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[2];
      json = JSON.parse(jsonStr.trim());
    } else {
      console.warn("⚠️ No JSON found in Gemini voice response. Falling back.");
      json = { reply: text, context: history.join("\n") };
    }

    console.log("✅ Parsed voice reply JSON:", json);
    
    return {
      reply: json.reply || "I heard your voice message. I'm here to help you with KartavyaAI services.",
      context: json.context || history.join("\n"),
    };
    
  } catch (error) {
    console.error("❌ Voice processing failed:", error.message);
    throw new Error("Failed to process voice message");
  }
}

/**
 * Generates a WhatsApp reply using Gemini
 * @param {string} userMessage - Incoming user message (text or transcribed voice)
 * @param {string[]} history - Last 3-4 messages from the user
 * @param {boolean} isVoiceMessage - Whether the original message was voice
 * @returns {Promise<{reply: string, context: string}>}
 */
async function generateReplyFromGemini(userMessage, history = [], isVoiceMessage = false) {
  const voiceContext = isVoiceMessage ? "Note: This message was originally a voice message that has been transcribed." : "";
  
  const prompt = `
You are *KartavyaBot*, a professional WhatsApp chatbot for KartavyaAI, a company that builds AI and web solutions for clients.

Reply professionally to the following user message. Do not mention that you're an AI. Keep it human, helpful, and concise.
${voiceContext}

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

module.exports = { generateReplyFromGemini, processVoiceWithGemini };