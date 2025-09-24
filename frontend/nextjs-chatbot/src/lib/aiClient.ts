// src/lib/aiClient.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getBestGroqModel, groq } from './groqClient';

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Executes a prompt using the cascading AI gateway with automatic failover.
 * First attempts Groq (fastest), then falls back to Gemini (most reliable).
 * @param prompt The prompt to execute
 * @returns Promise resolving to the AI response
 */
export async function executePromptWithCascade(prompt: string): Promise<string> {

    // --- TIER 1: ATTEMPT GROQ (FASTEST) ---
    try {
        console.log("Attempting Tier 1: Groq (Llama 3)...");
        const modelToUse = await getBestGroqModel();
        const completion = await groq.chat.completions.create({
            model: modelToUse,
            messages: [{ role: "user", content: prompt }],
        });
        const answer = completion.choices[0].message.content;
        if (answer) {
            console.log("Success with Tier 1: Groq.");
            return answer;
        }
        throw new Error("Groq returned an empty response.");
    } catch (error: any) {
        console.warn("Tier 1 (Groq) failed. Falling back. Reason:", error.message);
    }

    // --- TIER 2: ATTEMPT GEMINI (POWERFUL) ---
    try {
        console.log("Attempting Tier 2: Google Gemini...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const answer = response.text();
        if (answer) {
            console.log("Success with Tier 2: Gemini.");
            return answer;
        }
        throw new Error("Gemini returned an empty response.");
    } catch (error: any) {
        console.error("Tier 2 (Gemini) also failed. Final error:", error.message);
        throw new Error("All AI providers failed to generate a response.");
    }
}
