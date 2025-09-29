// src/lib/model-utils.ts

// Define a simple interface for the models we care about.
export interface ApiModel {
  id: string;
  // We can add other properties like context_length if needed later.
}

/**
 * Fetches the list of all available models directly from the Fireworks AI API.
 * This is the core function to get our source of truth.
 * @returns {Promise<ApiModel[]>} A promise that resolves to a clean list of models.
 */
export async function fetchAvailableModels(): Promise<ApiModel[]> {
  if (!process.env.FIREWORKS_API_KEY) {
    throw new Error("CRITICAL SERVER ERROR: FIREWORKS_API_KEY is not set.");
  }

  try {
    const response = await fetch('/api/list-models', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const rawModels = await response.json();

    // Clean and filter the raw data into our simple ApiModel format.
    return rawModels
      .filter((model: any) => model.object === 'model') // Ensure we only get actual models
      .map((model: any) => ({ id: model.id }));

  } catch (error) {
    console.error('Error fetching available models:', error);
    throw new Error(`Failed to fetch models: ${error.message}`);
  }
}

/**
 * Parses the model ID string to find the parameter size (e.g., 8 from 'llama-v3-8b-instruct').
 * @param {string} modelId The model ID string.
 * @returns {number} The parameter size in billions, or Infinity if not found.
 */
function getModelSize(modelId: string): number {
  const match = modelId.match(/(\d+)b/); // Regex to find the number followed by 'b'
  return match ? parseInt(match[1], 10) : Infinity;
}

/**
 * Selects the best "helper" model from a given list of available models.
 * The strategy: find the smallest available 'instruct' model.
 * @param {ApiModel[]} models The full list of available models.
 * @returns {ApiModel | null} The best helper model, or null if no suitable model is found.
 */
export function selectSmallestInstructModel(models: ApiModel[]): ApiModel | null {
  const sortedInstructModels = models
    // 1. Filter for instruction-tuned models only.
    .filter(model => model.id.includes('instruct'))
    // 2. Sort them by size, smallest first.
    .sort((a, b) => getModelSize(a.id) - getModelSize(b.id));

  // 3. The best model is the first one in the sorted list.
  return sortedInstructModels.length > 0 ? sortedInstructModels[0] : null;
}

/**
 * Gets the best available helper model with comprehensive error handling and fallbacks.
 * This is the main function that API routes should use.
 * @returns {Promise<{model: ApiModel, modelList: ApiModel[]}>} The selected model and full model list.
 */
export async function getBestHelperModel(): Promise<{model: ApiModel, modelList: ApiModel[]}> {
  try {
    // Fetch all available models
    const allModels = await fetchAvailableModels();

    // Select the best helper model
    const helperModel = selectSmallestInstructModel(allModels);

    if (!helperModel) {
      throw new Error("No suitable 'instruct' models are currently available from the provider.");
    }

    console.log(`[model-utils] Dynamically selected helper model: ${helperModel.id}`);

    return {
      model: helperModel,
      modelList: allModels
    };

  } catch (error) {
    console.error('Error selecting helper model:', error);
    throw error;
  }
}
