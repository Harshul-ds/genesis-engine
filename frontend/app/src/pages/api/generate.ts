// src/pages/api/generate.ts
import { NextApiRequest, NextApiResponse } from 'next';

const FIREWORKS_API_URL = "https://api.fireworks.ai/inference/v1/chat/completions";

// Helper function to write structured events to the stream
const writeEvent = (res: NextApiResponse, type: string, payload: any) => {
  res.write(`data: ${JSON.stringify({ type, payload })}\n\n`);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const fireworksApiKey = process.env.FIREWORKS_API_KEY;

  if (!fireworksApiKey) {
    writeEvent(res, 'error', { message: 'Fireworks API key not configured.' });
    res.end();
    return;
  }

  const { history, model } = req.body;

  if (!model) {
    writeEvent(res, 'error', { message: 'Model ID is required.' });
    res.end();
    return;
  }

  try {
    console.log(`[generate.ts] Making a DIRECT streaming call to Fireworks AI for model '${model}'...`);

    // Set up streaming response headers
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const response = await fetch(FIREWORKS_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${fireworksApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        model: model,
        messages: history,
        stream: true,
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error(`Fireworks API error: ${response.status} - ${response.statusText}`);
      writeEvent(res, 'error', { message: `Fireworks API error: ${response.statusText}` });
      res.end();
      return;
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Response body is null');
    }

    let buffer = '';
    let fullThought = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // Send final completion event
        writeEvent(res, 'stream_end', { message: "AI has finished generating its thought." });
        res.end();
        break;
      }

      const chunk = decoder.decode(value);
      buffer += chunk;

      // Process complete lines from buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));

            if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
              const content = data.choices[0].delta.content;
              fullThought += content;

              // Send structured thought chunk event instead of raw text
              writeEvent(res, 'thought_chunk', { text: content });
            }
          } catch (e) {
            // Skip malformed JSON lines
            continue;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in generate API:', error);
    writeEvent(res, 'error', { message: error.message });
    res.end();
  }
}
