// src/pages/api/generate-single-prompt.ts
import { NextRequest } from 'next/server';
import { FireworksProvider } from '../../lib/providers/fireworks';

export const runtime = 'edge'

export default async function POST(req: NextRequest) {
  try {
    const { topic, goal, persona, model } = await req.json();

    if (!topic || !goal || !persona || !model) {
      return new Response('Missing required fields', { status: 400 });
    }

    const aiProvider = new FireworksProvider(model);

    // This prompt focuses on generating a single persona's perspective
    const prompt = `
      As the "${persona}" persona, craft a focused prompt that brings your unique expertise 
      to analyzing the following topic and goal:

      TOPIC: "${topic}"
      GOAL: "${goal}"

      Your expertise as "${persona}" is particularly valuable here because you can provide
      specialized insights from your domain. Craft a prompt that:

      1. Leverages your specific knowledge and perspective
      2. Focuses on achieving the stated goal
      3. Maintains your authentic voice and expertise
      4. Is clear, concise, and actionable
      5. Is no more than 200 words
    `;

    const response = await aiProvider.generateCompletion(prompt);
    return new Response(response);

  } catch (error: any) {
    console.error('Failed to generate single prompt:', error);
    return new Response(error.message || 'Internal server error', { status: 500 });
  }
}