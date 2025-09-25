// src/pages/api/chat.ts

import { NextApiRequest, NextApiResponse } from 'next';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  history: ChatMessage[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('\n--- [chat.ts] API Request Received ---'); // Debug log

  if (req.method !== 'POST') {
    console.log('[chat.ts] Error: Method was not POST.');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { history }: ChatRequest = req.body;

    console.log('[chat.ts] Request body received:', { historyLength: history?.length }); // Debug log

    if (!history || !Array.isArray(history)) {
      console.log('[chat.ts] Error: History array is missing or invalid');
      return res.status(400).json({ error: 'History array is required' });
    }

    // Get the latest user message to send to Groq
    const lastUserMessage = history
      .slice()
      .reverse()
      .find(msg => msg.role === 'user')?.content;

    console.log('[chat.ts] Last user message:', lastUserMessage?.substring(0, 100) + '...'); // Debug log

    if (!lastUserMessage) {
      console.log('[chat.ts] Error: No user message found in history');
      return res.status(400).json({ error: 'No user message found in history' });
    }

    // Get Groq API key from environment
    const groqApiKey = process.env.GROQ_API_KEY;
    console.log('[chat.ts] GROQ_API_KEY exists:', !!groqApiKey); // Debug log - don't log the actual key

    if (!groqApiKey) {
      console.error('[chat.ts] CRITICAL ERROR: GROQ_API_KEY is not set in .env.local!');
      return res.status(500).json({ error: 'Server configuration error: Groq API key is missing.' });
    }

    // Call Groq API
    console.log('[chat.ts] Calling Groq API with model llama3-8b-8192...');
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192', // You can change this to any Groq model
        messages: history.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    console.log('[chat.ts] Groq API response status:', groqResponse.status); // Debug log

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('[chat.ts] Groq API error response:', errorText);
      return res.status(500).json({ error: 'Failed to get response from Groq', details: errorText });
    }

    const groqData = await groqResponse.json();
    console.log('[chat.ts] Groq API response received successfully'); // Debug log

    const assistantResponse = groqData.choices[0]?.message?.content;

    if (!assistantResponse) {
      console.error('[chat.ts] Error: No response content from Groq:', groqData);
      return res.status(500).json({ error: 'No response from Groq API' });
    }

    console.log('[chat.ts] Successfully returning response to frontend'); // Debug log
    res.status(200).json({ text: assistantResponse });

  } catch (error: any) {
    console.error('[chat.ts] ERROR in chat API:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
}
