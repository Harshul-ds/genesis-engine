// src/pages/api/suggest-topics.ts
import { NextApiRequest, NextApiResponse } from 'next';
// Import our new self-healing utilities!
import { getBestHelperModel } from '../../lib/model-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 1. Dynamically fetch ALL available models and select the best helper model.
    const { model: helperModel } = await getBestHelperModel();

    console.log(`[suggest-topics] Dynamically selected helper model: ${helperModel.id}` );

    const prompt = `
      Provide a list of 8 deeply interesting, multidisciplinary topics that would be
      excellent starting points for an AI-powered creative or strategic session.
      Format the output as a JSON array of strings. Do not include any other text.
      Example: ["The future of decentralized science (DeSci)", "The philosophy of post-humanism", "Sustainable fashion and eco-friendly textiles", "AI-powered personal finance management", "Remote work productivity tools", "Mental health and wellness apps", "Blockchain applications in supply chain", "Renewable energy storage solutions"]
    `;

    // 2. USE the dynamically selected model ID in the API call.
    const response = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FIREWORKS_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model: helperModel.id, // No more hardcoded value!
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 400,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`Fireworks API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response.");
    }

    // Try to parse as JSON array
    let topicsArray: string[] = [];
    try {
      // First, try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        topicsArray = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: split by newlines and clean up
        topicsArray = content.split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 10 && line.length < 100)
          .slice(0, 8);
      }
    } catch (parseError) {
      // Fallback: split by newlines and clean up
      topicsArray = content.split('\n')
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
        .filter((line: string) => line.length > 10 && line.length < 100)
        .slice(0, 8);
    }

    // Ensure we have at least some topics
    if (topicsArray.length === 0) {
      topicsArray = [
        'Sustainable fashion and eco-friendly textiles',
        'AI-powered personal finance management',
        'Remote work productivity tools',
        'Mental health and wellness apps',
        'Blockchain applications in supply chain',
        'Renewable energy storage solutions',
        'Autonomous vehicle safety systems',
        'Personalized learning platforms'
      ];
    }

    res.status(200).json(topicsArray);

  } catch (error) {
    console.error("Error generating topic suggestions:", error);

    // Return fallback topics on error - ensures UX never breaks
    res.status(200).json([
      'Sustainable fashion and eco-friendly textiles',
      'AI-powered personal finance management',
      'Remote work productivity tools',
      'Mental health and wellness apps',
      'Blockchain applications in supply chain',
      'Renewable energy storage solutions',
      'Autonomous vehicle safety systems',
      'Personalized learning platforms'
    ]);
  }
}
