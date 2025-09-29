import { getBestHelperModel } from '../../../lib/model-utils';
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!process.env.FIREWORKS_API_KEY) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const { topic } = req.body;

  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    return res.status(400).json({ error: 'A valid "topic" is required.' });
  }

  try {
    const { model: helperModel } = await getBestHelperModel();

    console.log(`[suggest-goals] Dynamically selected helper model: ${helperModel.id}` );

    const prompt = `
      Based on the user's topic "${topic}", generate a list of 8 distinct,
      action-oriented strategic goals. These goals should be clear, concise, and
      represent different approaches to working with this topic.
      Format the output as a JSON array of strings. Do not include any other text.
      Example: ["Create a comprehensive business plan for ${topic}", "Write a detailed technical guide about ${topic}", "Develop marketing content and strategy for ${topic}", "Design an educational course on ${topic}", "Build a product roadmap for ${topic} solutions", "Create research documentation for ${topic}", "Develop case studies and examples for ${topic}", "Design user experience flows for ${topic} applications"]
    `;

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
        max_tokens: 600,
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
    let goalsArray: string[] = [];
    try {
      // First, try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        goalsArray = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: split by newlines and clean up
        goalsArray = content.split('\n')
          .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
          .filter((line: string) => line.length > 10 && line.length < 150)
          .slice(0, 8);
      }
    } catch (parseError) {
      // Fallback: split by newlines and clean up
      goalsArray = content.split('\n')
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
        .filter((line: string) => line.length > 10 && line.length < 150)
        .slice(0, 8);
    }

    // Ensure we have at least some goals
    if (goalsArray.length === 0) {
      goalsArray = [
        `Create a comprehensive business plan for ${topic}`,
        `Write a detailed technical guide about ${topic}`,
        `Develop marketing content and strategy for ${topic}`,
        `Design an educational course on ${topic}`,
        `Build a product roadmap for ${topic} solutions`,
        `Create research documentation for ${topic}`,
        `Develop case studies and examples for ${topic}`,
        `Design user experience flows for ${topic} applications`
      ];
    }

    res.status(200).json(goalsArray);

  } catch (error) {
    console.error(`Error generating goal suggestions for topic "${topic}":` , error);
    // Return fallback goals on error
    res.status(200).json([
      `Create a comprehensive business plan for ${topic}`,
      `Write a detailed technical guide about ${topic}`,
      `Develop marketing content and strategy for ${topic}`,
      `Design an educational course on ${topic}`,
      `Build a product roadmap for ${topic} solutions`,
      `Create research documentation for ${topic}`,
      `Develop case studies and examples for ${topic}`,
      `Design user experience flows for ${topic} applications`
    ]);
  }
}
