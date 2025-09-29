// src/pages/api/list-models.ts
import { NextApiRequest, NextApiResponse } from 'next';

const FIREWORKS_MODELS_API_URL = "https://api.fireworks.ai/inference/v1/models";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const fireworksApiKey = process.env.FIREWORKS_API_KEY;
  if (!fireworksApiKey) {
    return res.status(500).json({ error: 'Fireworks API key not configured.' });
  }

  try {
    const response = await fetch(FIREWORKS_MODELS_API_URL, {
      headers: { 'Authorization': `Bearer ${fireworksApiKey}`  },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models from Fireworks AI: ${response.statusText}` );
    }

    const data = await response.json();
    
    // Filter for the best instruction-following models that are ready to use
    const availableModels = data.data
      .filter(model => 
        model.id.includes('instruct') && // We only want instruction-following models
        model.object === 'model'
      )
      .map(model => {
        // Let's create a category based on the model's context window size.
        let category = "Standard Context";
        if (model.context_length >= 32000) category = "Large Context";
        if (model.id.includes('code')) category = "Code & Instruct";
        if (model.id.includes('llama-v3p1-70b')) category = "Flagship Model";
        
        return { 
          id: model.id, 
          name: model.id.replace('accounts/fireworks/models/', ''), // Clean up the name for the UI
          category: category,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    console.log(`[list-models] Discovered ${availableModels.length} models directly from Fireworks AI.` );
    res.status(200).json(availableModels);

  } catch (error) {
    console.error("Failed to list Fireworks models:", error);
    res.status(500).json({ error: 'Failed to fetch model list from Fireworks AI.' });
  }
}
