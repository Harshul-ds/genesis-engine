// src/pages/api/suggest-topics.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const tavilyApiKey = process.env.TAVILY_API_KEY;
    if (!tavilyApiKey) {
      throw new Error("Tavily API key is not configured.");
    }

    // 1. Search for recent, high-level tech and science news using Tavily API
    const searchResponse = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query: "latest breakthroughs in technology, science, and society",
        search_depth: "basic",
        max_results: 5,
        include_raw_content: false,
      }),
    });

    if (!searchResponse.ok) {
      throw new Error(`Tavily API error: ${searchResponse.status} - ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();

    // 2. Use the search results as context for generating creative topics
    const context = searchData.results?.map((r: any) => `- ${r.title}: ${r.content || r.description || ''}`).join('\n') || '';

    // 3. Generate topics using Fireworks AI with the search context
    const { getBestHelperModel } = await import('../../lib/model-utils');
    const { model: helperModel } = await getBestHelperModel();

    const prompt = `Based on the following recent news and breakthroughs, generate a list of exactly 4 fascinating and forward-thinking project topics. The topics should be inspiring and non-obvious. Return ONLY the topics, each on a new line. Do not include any numbering or bullet points.

Context from today's news:
${context}

Generate topics that would be excellent starting points for creative or strategic AI sessions.`;

    const response = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FIREWORKS_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model: helperModel.id,
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

    // Parse the topics from the response
    let topicsArray: string[] = [];
    try {
      // First, try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        topicsArray = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: split by newlines and clean up
        topicsArray = content
          .split('\n')
          .map(t => t.trim()) // Trim whitespace from each line
          // Filter out empty lines AND any line that looks like a preamble/heading.
          .filter(t => t && !t.toLowerCase().includes('here are') && !t.toLowerCase().includes('project topics'))
          .slice(0, 4);
      }
    } catch (parseError) {
      // Fallback: split by newlines and clean up
      topicsArray = content.split('\n')
        .map((line: string) => line.replace(/^\d+\.\s*/, '').replace(/^-+\s*/, '').trim())
        .filter((line: string) => line && !line.toLowerCase().includes('here are') && !line.toLowerCase().includes('project topics'))
        .slice(0, 4);
    }

    if (topicsArray.length === 0) {
      topicsArray = [
        'Sustainable fashion and eco-friendly textiles',
        'AI-powered personal finance management',
        'Remote work productivity tools',
        'Mental health and wellness apps'
      ];
    }

    res.status(200).json(topicsArray);

  } catch (error: any) {
    console.error("Error generating topic suggestions:", error);

    // Return fallback topics on error - ensures UX never breaks
    res.status(200).json([
      'Sustainable fashion and eco-friendly textiles',
      'AI-powered personal finance management',
      'Remote work productivity tools',
      'Mental health and wellness apps'
    ]);
  }
}
