import OpenAI from 'openai';

// Initialize ONLY the Groq client
const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

// A global cache for the model name to avoid repeated API calls.
let cachedBestModel: string | null = null;

/**
 * Dynamically discovers the best available, general-purpose model from Groq.
 * This makes the system resilient to model deprecations and allows for auto-upgrades.
 */
async function getBestGroqModel(): Promise<string> {
    if (cachedBestModel) {
        return cachedBestModel;
    }

    console.log("Dynamically discovering the best available Groq model...");
    const modelsResponse = await groq.models.list();
    const availableModels = modelsResponse.data;

    // Define our preference criteria. We want the best Llama models first.
    const modelPreferences = [
        "llama-3.3-70b-versatile",
        "llama3-70b-8192", // Kept for future-proofing
        "gemma2-9b-it",     // A great, fast alternative from Google
        "llama3-8b-8192",   // A smaller, faster fallback
    ];

    for (const preferredModel of modelPreferences) {
        if (availableModels.some(apiModel => apiModel.id === preferredModel)) {
            console.log(`Found and cached best available model: ${preferredModel}` );
            cachedBestModel = preferredModel;
            return preferredModel;
        }
    }

/**
 * Lists all available models from Groq.
 * This is used by the /api/list-models endpoint.
 */
export async function listAvailableModels(): Promise<string[]> {
    try {
        console.log("Fetching available models from Groq API...");
        const modelsResponse = await groq.models.list();

        // Return all available model IDs
        const availableModels = modelsResponse.data.map(model => model.id);

        console.log("Found available models:", availableModels);
        return availableModels;

    } catch (error) {
        console.error("Failed to fetch available models from Groq:", error);
        return [];
    }
}

/**
 * The single, definitive function for executing a prompt.
 * It automatically uses the best available model.
 */
export async function executePromptWithGroq(prompt: string): Promise<string> {
    try {
        const modelToUse = await getBestGroqModel();

        console.log(`Executing prompt with dynamically selected Groq model: ${modelToUse}` );
        const completion = await groq.chat.completions.create({
            model: modelToUse,
            messages: [{ role: "user", content: prompt }],
        });

        const answer = completion.choices[0].message.content;
        if (!answer) throw new Error("Groq returned an empty response.");

        return answer;

    } catch (error: any) {
        console.error(`Groq execution failed:` , error.message);
        throw new Error(`AI execution failed.` );
    }
}
