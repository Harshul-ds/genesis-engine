// src/pages/api/list-models.ts
import { NextApiRequest, NextApiResponse } from 'next';
import Groq from 'groq-sdk';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return res.status(500).json({ error: 'Groq API key not configured on the server.' });
  }

  try {
    const groq = new Groq({ apiKey: groqApiKey });
    const models = await groq.models.list();

    // THE KEY CHANGE: Filter for only ACTIVE models to prevent deprecated model errors
    const availableModels = models.data
      .filter(model => model.active === true) // <-- Proactively remove all deprecated models
      .filter(model => model.id.includes('llama') || model.id.includes('mixtral') || model.id.includes('gemma')) // Focus on reliable models
      .map(model => ({ id: model.id, name: model.id }))
      .sort((a, b) => a.name.localeCompare(b.name));

    console.log(`[list-models] Found ${availableModels.length} active models`);
    res.status(200).json(availableModels);
  } catch (error) {
    console.error("Failed to list Groq models:", error);
    res.status(500).json({ error: 'Failed to fetch model list from Groq.' });
  }
}
