// src/lib/model-utils.ts

// Define the simple interface for the models we care about.
export interface ApiModel {
    id: string;
    name: string;
  }
    
  /**
   * Fetches the list of all available models using the standard global `fetch`.
   * This is the correct way to make a direct REST API call from the server-side.
   */
  export async function fetchAvailableModels(): Promise<ApiModel[]> {
    const apiKey = process.env.FIREWORKS_API_KEY;
    if (!apiKey) {
      throw new Error("CRITICAL SERVER ERROR: FIREWORKS_API_KEY is not set.");
    }
    
    try {
      const response = await fetch('https://api.fireworks.ai/inference/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
          const errorBody = await response.json();
          throw new Error(`Fireworks API error: ${response.status} - ${errorBody.error?.message}`);
      }
  
      const rawModelData = await response.json();
      
      // Clean, filter, and format the raw data.
      return rawModelData.data
        .filter((model: any) => model.id.includes('instruct'))
        .map((model: any) => ({ 
          id: model.id,
          name: model.id.split('/').pop()?.replace(/-/g, ' ') || model.id,
        }));
  
    } catch (error) {
      console.error("Error fetching available models directly from Fireworks API:", error);
      throw error;
    }
  }
    
  /**
   * Parses the model ID string to find the parameter size.
   */
  function getModelSize(modelId: string): number {
    const match = modelId.match(/(\d+)b/);
    return match ? parseInt(match[1], 10) : Infinity;
  }
    
  /**
   * Selects the best "helper" model from a given list of available models.
   */
  export function selectSmallestInstructModel(models: ApiModel[]): ApiModel | null {
    const sortedInstructModels = [...models].sort((a, b) => getModelSize(a.id) - getModelSize(b.id));
    return sortedInstructModels.length > 0 ? sortedInstructModels[0] : null;
  }
  
  /**
   * --- THIS IS THE FUNCTION YOUR API ROUTE NEEDS ---
   * It combines fetching and selecting into a single, convenient helper.
   * We are adding the `export` keyword so it can be imported.
   */
  export async function getBestHelperModel(): Promise<{model: ApiModel}> {
    const allModels = await fetchAvailableModels();
    const helperModel = selectSmallestInstructModel(allModels);
  
    if (!helperModel) {
      throw new Error("No suitable 'instruct' models are currently available.");
    }
    
    return { model: helperModel };
  }