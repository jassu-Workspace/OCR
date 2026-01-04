
import { GoogleGenAI } from "@google/genai";

export const analyzeDocumentWithAI = async (base64Image: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "API Key not configured for AI analysis.";

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            text: "Analyze this document image. Identify the type of document, key entities (names, dates, amounts), summary of content, and structure it clearly. If it's a receipt, list items and taxes. If it's a contract, list parties and key terms.",
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image.split(',')[1],
            },
          },
        ],
      },
    });

    return response.text || "No AI analysis could be generated.";
  } catch (error) {
    console.error('Gemini Analysis Error:', error);
    return `AI Analysis failed: ${error instanceof Error ? error.message : String(error)}`;
  }
};
