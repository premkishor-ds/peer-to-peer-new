import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateIcebreakers = async (): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Generate 3 fun, creative, and distinct conversation starters or icebreakers for a video call between two friends or colleagues. Keep them short and engaging. Return only the questions as a plain text list separated by newlines.",
    });

    const text = response.text || "";
    return text.split('\n').filter(line => line.trim().length > 0).map(line => line.replace(/^[-\d.]+\s*/, ''));
  } catch (error) {
    console.error("Gemini Icebreaker Error:", error);
    return ["Tell me about your favorite travel destination.", "What is the best meal you've had recently?", "If you could have any superpower, what would it be?"];
  }
};

export const refineMessage = async (input: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Rewrite the following text to be more professional, polite, and concise for a chat message: "${input}"`,
    });
    return response.text || input;
  } catch (error) {
    console.error("Gemini Refine Error:", error);
    return input;
  }
};