import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
let ai: GoogleGenAI | null = null;
function getAI() {
  if (!apiKey) return null;
  if (!ai) ai = new GoogleGenAI({ apiKey });
  return ai;
}

export const generateObjectivesWithAI = async (subject: string, level: string): Promise<string[]> => {
  if (!apiKey) return ["API Key not found. Please check environment variables."];

  try {
    const prompt = `
      For the subject "${subject}" and level "${level}", within the context of the Learning Station model,
      write 3 SMART (Specific, Measurable, Achievable, Relevant, Time-bound) learning objectives.
      Return only the objectives as a bulleted list. Do not add any other text. Respond in English.
    `;

    const response = await getAI()!.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    const text = response.text || '';
    // Simple parsing to split by newlines and remove bullets
    return text.split('\n').filter(line => line.trim().length > 0).map(line => line.replace(/^[•\-\*]\s*/, ''));
  } catch (error) {
    console.error("Gemini Error:", error);
    return ["An error occurred while generating objectives with AI."];
  }
};

export const generateModuleIdeasWithAI = async (objective: string): Promise<any> => {
  if (!apiKey) return null;

  try {
    const prompt = `
       Create a Learning Station module draft for the following learning objective: "${objective}".
       
       Return a single JSON object with the following fields:
       {
         "title": "Module Title",
         "description": "Short description (2-3 sentences)",
         "learningOutcomes": ["Outcome 1", "Outcome 2"],
         "suggestedDeliveryModes": ["Lecture", "Case Study"] (English keywords)
       }
       Return only JSON.
     `;

    const response = await getAI()!.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};