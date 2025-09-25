// src/lib/engine.ts
import { createClient } from '@supabase/supabase-js';
import { GenerateRequest, GenerateResponse } from './types';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

export async function runPromptEngine(request: GenerateRequest): Promise<{meta_prompt: string}> {

    // --- Step 1: Fetch the Recipe using a specific RPC function ---
    console.log(`Fetching template for goal: ${request.goal}` );
    const { data: templateData, error: templateError } = await supabaseAdmin
        .rpc('fetch_template_by_goal_rpc', {
            goal_param: request.goal
        });

    console.log('=== DATABASE DEBUG INFO ===');
    console.log('Template Error:', templateError);
    console.log('Template Data:', JSON.stringify(templateData, null, 2));

    if (templateError) {
        throw new Error(`Supabase RPC failed for 'fetch_template_by_goal_rpc': ${templateError.message}` );
    }
    if (!templateData) {
        throw new Error(`Could not find a prompt template for goal: ${request.goal}` );
    }
    const assemblyPlan = templateData.assembly_plan;

    // --- Step 2: Execute the Assembly Plan ---
    let promptParts: string[] = [];

    for (const step of assemblyPlan.steps) {

        console.log(`Executing step: ${step.step_name}` );

        if (step.is_dynamic) {
            // Handle dynamic context as before
            if (step.component_type === 'Context' && step.content_placeholder) {
                // Replace the placeholder with dynamic context from variables
                let dynamicContent = step.content_placeholder;
                for (const key in request.variables) {
                    dynamicContent = dynamicContent.replace(`{${key}}`, request.variables[key]);
                }
                promptParts.push(dynamicContent);
            }
            continue; // Skip the rest of the loop for this step
        }

        // --- THE FIX IS HERE ---
        // Handle the new DynamicAgent architecture with by_variable selection
        if (step.selection_logic && step.selection_logic.by_variable) {
            // Get the variable name from the selection logic
            const variableName = step.selection_logic.by_variable;
            const termToFetch = request.variables[variableName];

            if (!termToFetch) {
                console.warn(`Variable '${variableName}' not found in request variables`);
                console.log('Available variables:', Object.keys(request.variables));
                continue;
            }

            console.log(`Fetching component for variable '${variableName}' with term: ${termToFetch}`);

            const { data: componentData, error: componentError } = await supabaseAdmin
                .rpc('fetch_component_by_term_rpc', {
                    term_param: termToFetch
                });

            console.log(`Component Error for term '${termToFetch}':`, componentError);
            console.log(`Component Data for term '${termToFetch}':`, JSON.stringify(componentData, null, 2));

            if (componentError) {
                 console.warn(`RPC failed for 'fetch_component_by_term_rpc' with term: ${termToFetch}` );
                 continue;
            }

            if (componentData) {
                let componentContent = componentData.content;
                console.log(`Original component content for '${termToFetch}':`, componentContent);

                // Variable replacement
                for (const key in request.variables) {
                    componentContent = componentContent.replace(`{${key}}` , request.variables[key]);
                }
                console.log(`Processed component content for '${termToFetch}':`, componentContent);

                promptParts.push(componentContent);
            }
        } else {
            console.log(`Skipping step '${step.step_name}' - no selection_logic.by_variable found`);
            console.log('Step details:', JSON.stringify(step, null, 2));
        }
    }

    // --- Step 3: Assemble the Final Meta-Prompt ---
    const meta_prompt = promptParts.join('\n\n');

    console.log('=== FINAL ASSEMBLY ===');
    console.log('Number of prompt parts:', promptParts.length);
    console.log('Assembled Meta-Prompt:');
    console.log('---BEGIN META-PROMPT---');
    console.log(meta_prompt);
    console.log('---END META-PROMPT---');

    return { meta_prompt }; // Return only the assembled prompt
}
