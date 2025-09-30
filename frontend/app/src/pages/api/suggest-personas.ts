// src/pages/api/suggest-personas.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { fireworks } from '@ai-sdk/fireworks';
import { generateText, tool } from 'ai';
import { z } from 'zod';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { topic, goal } = req.body;
    if (!topic || !goal) {
      return res.status(400).json({ error: 'Topic and goal are required' });
    }

    const model = fireworks('accounts/fireworks/models/llama-v3p1-70b-instruct');

    // We still use the `tool`  definition to guide the AI's output structure.
    const dreamTeamTool = tool({
      description: 'A dynamically sized list of generated expert personas.',
      parameters: z.object({
        personas: z.array(
          z.object({
            term: z.string().describe('A unique, creative name for the persona (e.g., "Computational Linguist" or "Market Adoption Strategist").'),
            description: z.string().describe('A one-sentence description of their specific skills relevant to the topic.'),
          })
        ),
      }),
    });

    const { toolCalls, text } = await generateText({
      model: model,
      prompt: `Analyze the user's topic: "${topic}" and goal: "${goal}". Based on the complexity and multifaceted nature of this request, identify the necessary set of distinct, non-obvious expert personas required to achieve the goal. You must use the 'dreamTeam' tool to return your answer.` ,
      tools: { dreamTeam: dreamTeamTool },
    });

    // ✨ THE DEFINITIVE FIX: Manually parse the `toolCalls`  array ✨
    // This is more reliable than relying on the potentially buggy `toolResult` .
    if (toolCalls && toolCalls.length > 0 && toolCalls[0].toolName === 'dreamTeam') {
      console.log("[API/suggest-personas] Tool call received:", JSON.stringify(toolCalls[0], null, 2));

      const dreamTeamArgs = toolCalls[0].args;

      console.log("[API/suggest-personas] Tool args type:", typeof dreamTeamArgs);
      console.log("[API/suggest-personas] Tool args content:", JSON.stringify(dreamTeamArgs, null, 2));

      // The args might be nested or in a different format
      let parsedArgs = dreamTeamArgs;

      // If args is a string that needs parsing, or if it's nested
      if (typeof dreamTeamArgs === 'string') {
        try {
          parsedArgs = JSON.parse(dreamTeamArgs);
        } catch (e) {
          console.log("[API/suggest-personas] Failed to parse string args:", e);
          throw new Error("Tool call arguments are malformed.");
        }
      }

      console.log("[API/suggest-personas] Parsed args:", JSON.stringify(parsedArgs, null, 2));

      // We can even validate the result against our Zod schema for extra safety.
      const validation = dreamTeamTool.parameters.safeParse(parsedArgs);

      if (validation.success) {
        // Success! Send the validated personas back to the client.
        return res.status(200).json(validation.data.personas);
      } else {
        // The AI returned the tool call, but the arguments were malformed.
        console.error("[API/suggest-personas] Zod validation failed:", validation.error);
        throw new Error("AI returned a malformed team structure.");
      }
    }

    // If we reach here, the AI failed to make any valid tool call.
    console.error(`[API/suggest-personas] AI failed to make a tool call. Raw output: ${text}` );
    throw new Error('AI failed to generate a valid team structure. The model may be temporarily unavailable.');

  } catch (error: any) {
    console.error('[API/suggest-personas] Critical Error:', error.message);
    res.status(500).json({ error: error.message });
  }
}