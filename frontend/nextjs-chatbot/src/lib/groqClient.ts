// src/lib/groqClient.ts

import OpenAI from 'openai';

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

// A global cache to store the model name so we don't look it up on every single request.
let cachedBestModel: string | null = null;

/**
 * Finds the best available Llama 3 model from the Groq API.
 * It prioritizes larger, more capable models.
 */
export async function getBestGroqModel(): Promise<string> {
    // 1. Use the cache if we already found the model.
    if (cachedBestModel) {
        return cachedBestModel;
    }

    console.log("Dynamically discovering the best available Groq model...");
    try {
        // 2. Call the provider's model discovery endpoint.
        const modelsResponse = await groq.models.list();
        const availableModels = modelsResponse.data;

        console.log("=== AVAILABLE GROQ MODELS ===");
        console.log("All available models:", availableModels.map(m => m.id).join(', '));

        // 3. Define our preference criteria. We want the biggest, best Llama 3.
        const modelPreferences = [
            "llama-3.3-70b-versatile", // Latest and greatest - should work
            "llama-3.1-8b-instant",    // Fast and reliable - should work
            "deepseek-r1-distill-llama-70b", // High quality alternative - should work
            "meta-llama/llama-4-scout-17b-16e-instruct", // New Llama 4 - should work
            "meta-llama/llama-4-maverick-17b-128e-instruct", // Another Llama 4 - should work
            "gemma2-9b-it", // Google's Gemma model - should work
            "llama3-70b-8192", // Legacy fallback
            "llama3-8b-8192",  // Legacy fallback
        ];

        // 4. Find the first model from our preference list that actually exists in the provider's list.
        for (const preferredModel of modelPreferences) {
            if (availableModels.some(apiModel => apiModel.id === preferredModel)) {
                console.log(`Found best available model: ${preferredModel}` );
                cachedBestModel = preferredModel; // 5. Cache the result for future invocations.
                return preferredModel;
            }
        }

        throw new Error("No suitable Llama 3 model found in Groq's available models.");

    } catch (error) {
        console.error("Failed to discover Groq models:", error);
        // 6. As a final, hardcoded fallback, use a known stable model.
        //    This is your safety net if the discovery API itself fails.
        return "llama-3.3-70b-versatile";
    }
}

// Export the groq client for use in API routes
export { groq };
