// src/pages/api/generate.ts

import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';
import { searchWeb } from '../../lib/tools';
import { executePromptWithCascade } from '../../lib/aiClient';
import { GenerateRequest, GenerateResponse } from '../../lib/types';

// Use the SERVICE_ROLE_KEY for trusted, server-side operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const requestBody: GenerateRequest = req.body;
        const variables = requestBody.variables;

        // --- PHASE 1.4: DYNAMIC RAG STEP ---
        const topic_for_search = variables.concept_a && variables.concept_b
            ? `${variables.concept_a} vs ${variables.concept_b}`
            : variables.topic || '';

        let dynamicRagContext = '';
        if (topic_for_search) {
            dynamicRagContext = await searchWeb(topic_for_search);
        }

        const finalVariables = {
            ...variables,
            dynamic_rag_context: dynamicRagContext
        };

        // --- STEP 1: CALL THE DATABASE "BRAIN" ---
        console.log("Calling database function 'generate_meta_prompt' with enriched variables...");
        const { data: meta_prompt, error: rpcError } = await supabaseAdmin
            .rpc('generate_meta_prompt', {
                goal_param: requestBody.goal,
                variables_json: finalVariables
            });

        if (rpcError) throw rpcError;

        // --- STEP 2: EXECUTE with the Cascading Gateway ---
        const finalAnswer = await executePromptWithCascade(meta_prompt);

        // --- STEP 3: RETURN THE RESULT ---
        const finalResponse: GenerateResponse = {
            final_answer: finalAnswer,
            meta_prompt_used: meta_prompt
        };
        res.status(200).json(finalResponse);

    } catch (error: any) {
        console.error("Error in generate API:", error);
        res.status(500).json({ error: error.message });
    }
}
