/**
 * Google Gemini AI Client
 * Wrapper for the Gemini API with lazy initialization and error handling
 */

import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

let geminiClient: GoogleGenerativeAI | null = null;
let geminiModel: GenerativeModel | null = null;

/**
 * Get or initialize the Gemini client
 * Uses lazy initialization to avoid build-time errors
 */
function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    geminiClient = new GoogleGenerativeAI(apiKey);
  }
  return geminiClient;
}

/**
 * Get the Gemini model instance
 * @param modelName - The model to use (default: gemini-1.5-flash for speed/cost)
 */
export function getGeminiModel(
  modelName: string = "gemini-1.5-flash"
): GenerativeModel {
  if (!geminiModel || geminiModel.model !== modelName) {
    const client = getGeminiClient();
    geminiModel = client.getGenerativeModel({ model: modelName });
  }
  return geminiModel;
}

/**
 * Generate text using Gemini AI
 * @param prompt - The prompt to send to the model
 * @param modelName - Optional model name (default: gemini-1.5-flash)
 * @returns The generated text response
 */
export async function generateText(
  prompt: string,
  modelName?: string
): Promise<string> {
  try {
    const model = getGeminiModel(modelName);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("[GEMINI] Error generating text:", error);
    throw new Error(
      `Failed to generate text: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Generate structured JSON using Gemini AI
 * @param prompt - The prompt to send to the model
 * @param schema - JSON schema description for the response
 * @param modelName - Optional model name
 * @returns Parsed JSON object
 */
export async function generateJSON<T = any>(
  prompt: string,
  schema?: string,
  modelName?: string
): Promise<T> {
  try {
    const fullPrompt = schema
      ? `${prompt}\n\nRespond with valid JSON matching this schema:\n${schema}`
      : `${prompt}\n\nRespond with valid JSON only, no markdown formatting.`;

    const text = await generateText(fullPrompt, modelName);

    // Remove markdown code blocks if present
    const cleaned = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.error("[GEMINI] Error generating JSON:", error);
    throw new Error(
      `Failed to generate JSON: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Generate content with streaming response
 * Useful for long-form content generation with real-time feedback
 */
export async function* generateTextStream(
  prompt: string,
  modelName?: string
): AsyncGenerator<string, void, unknown> {
  try {
    const model = getGeminiModel(modelName);
    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      yield chunkText;
    }
  } catch (error) {
    console.error("[GEMINI] Error streaming text:", error);
    throw new Error(
      `Failed to stream text: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
