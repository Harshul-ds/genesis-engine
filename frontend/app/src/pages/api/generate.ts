// src/pages/api/generate.ts
import { NextApiRequest, NextApiResponse } from 'next';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  history: ChatMessage[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("\n--- [generate.ts] API Request Received ---");

  if (req.method !== 'POST') {
    console.log("[generate.ts] Error: Method was not POST.");
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // --- Check for Groq API Key ---
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey || groqApiKey.trim() === "") {
    console.error("[generate.ts] CRITICAL ERROR: GROQ_API_KEY is not set or is empty in .env.local!");
    return res.status(500).json({ error: 'Server configuration error: Groq API key is missing.' });
  }
  console.log("[generate.ts] Groq API Key found.");

  const { history, model }: { history: ChatMessage[], model: string } = req.body;
  if (!history || history.length === 0) {
    console.log("[generate.ts] Error: Request body was missing 'history'.");
    return res.status(400).json({ error: 'History is required.' });
  }
  if (!model) {
    console.log("[generate.ts] Error: Request body was missing 'model'.");
    return res.status(400).json({ error: 'Model is required.' });
  }
  console.log("[generate.ts] History received with", history.length, "messages.");
  console.log("[generate.ts] Using model:", model);

  try {
    // For this simple debugging version, we'll use fetch instead of the SDK
    console.log("[generate.ts] Calling Groq API with model", model + "...");
    
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: history,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    console.log("[generate.ts] Groq API response status:", groqResponse.status);

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error("[generate.ts] ERROR calling Groq API:", errorText);
      return res.status(500).json({ error: 'Failed to get response from Groq API.', details: errorText });
    }

    const groqData = await groqResponse.json();
    const generatedText = groqData.choices[0]?.message?.content || "";
    
    console.log("[generate.ts] Successfully received response from Groq.");
    
    res.status(200).json({ text: generatedText });

  } catch (error: any) {
    console.error("[generate.ts] ERROR calling Groq API:", error);
    res.status(500).json({ error: 'Failed to get response from Groq API.', details: error.message });
  }
}
