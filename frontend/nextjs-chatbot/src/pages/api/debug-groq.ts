// src/pages/api/debug-groq.ts
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        console.log("Getting list of available Groq models...");
        const modelsResponse = await groq.models.list();
        const availableModels = modelsResponse.data;

        console.log("=== ALL AVAILABLE GROQ MODELS ===");
        availableModels.forEach(model => {
            console.log(`- ${model.id}: ${model.owned_by}`);
        });

        res.status(200).json({
            success: true,
            available_models: availableModels.map(m => ({ id: m.id, owned_by: m.owned_by }))
        });

    } catch (error: any) {
        console.error("Failed to get Groq models:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}
