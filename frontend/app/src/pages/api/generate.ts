// src/pages/api/generate.ts
import { fireworks } from '@ai-sdk/fireworks';
import { streamText, StreamingTextResponse } from 'ai';
import { NextRequest } from 'next/server';

// Switch to the Edge Runtime for better streaming performance
export const config = {
  runtime: 'edge',
};

// ✅ Kept: Your utility to ensure model ID is in the correct Fireworks format
const normalizeModelId = (model: string) => {
  if (model.startsWith("accounts/")) return model; // already correct
  return `accounts/fireworks/models/${model}`;
};

const normalizeMessages = (history: any[]) => {
  if (!Array.isArray(history)) return [];
  return history
    .filter((msg) => msg && (msg.role || msg.type) && (msg.content || msg.text))
    .map((msg) => ({
      role: (msg.role || msg.type || 'user') as 'user' | 'assistant' | 'system',
      content: String(msg.content || msg.text || ''),
    }));
};

export default async function handler(req: NextRequest) {
  // ✅ Kept: Timeout logic using an AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

  try {
    // Note: In Edge runtime, we get the body from req.json()
    let { history, model } = await req.json();

    console.log(`[generate.ts] Raw request body:`, JSON.stringify({ history, model }));

    if (!model) {
      return new Response(JSON.stringify({ error: "Model ID is required." }), { status: 400 });
    }

    // ✅ Kept: Your normalization logic is used here
    model = normalizeModelId(model);
    const messages = normalizeMessages(history);
    
    console.log(`[generate.ts] History received:`, history);
    console.log(`[generate.ts] Normalized messages:`, messages);
    
    // Ensure we have at least one message
    if (messages.length === 0) {
      console.warn(`[generate.ts] No valid messages found, using fallback`);
      messages.push({ role: 'user', content: 'Hello' });
    }

    console.log(`[generate.ts] Streaming Fireworks response from model '${model}'...`);

    // ✨ Changed: Use the AI SDK's streamText for compatibility
    const result = await streamText({
      model: fireworks(model),
      messages: messages, // Use the normalized messages
      // Pass the abort signal for timeout handling
      abortSignal: controller.signal,
      // You can still pass other parameters here if needed
      maxTokens: 2048,
      temperature: 0.7,
    });
    
    // Once the stream starts, we can clear the timeout
    clearTimeout(timeoutId);

    // ✨ Changed: Use StreamingTextResponse to correctly pipe the stream
    return new StreamingTextResponse(result.toAIStream());

  } catch (error: any) {
    // ✅ Kept: Your error handling logic
    clearTimeout(timeoutId);
    console.error("Error in generate API:", error);

    if (error.name === 'AbortError') {
      return new Response(JSON.stringify({ error: "Request timed out." }), { status: 504 });
    }
    
    return new Response(JSON.stringify({ error: error.message || "An unknown error occurred." }), {
      status: 500,
    });
  }
}