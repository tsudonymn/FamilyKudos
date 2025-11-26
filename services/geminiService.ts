import { GoogleGenAI } from "@google/genai";

// FIX: Aligned with @google/genai coding guidelines.
// Initialize the GoogleGenAI client directly, assuming process.env.API_KEY is always available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getEncouragement = async (memberName: string, taskDescription: string): Promise<string> => {
  try {
    const prompt = `Generate a very short, cheerful, one-sentence message praising a family member named ${memberName} for completing the task: "${taskDescription}". The tone should be warm, positive, and encouraging. Do not use quotes in the response. Keep it under 15 words.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error fetching encouragement from Gemini:", error);
    return `Thank you, ${memberName}, for ${taskDescription}! That's a huge help!`;
  }
};
