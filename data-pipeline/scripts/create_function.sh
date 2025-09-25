#!/bin/bash

# Script to create the generate_meta_prompt database function
# Run this with: chmod +x create_function.sh && ./create_function.sh

echo "Creating generate_meta_prompt database function..."

# You can run this SQL in your Supabase SQL editor or via psql
cat << 'EOF'
CREATE OR REPLACE FUNCTION generate_meta_prompt(
    goal_param TEXT,
    variables_json JSONB
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    meta_prompt TEXT := '';
    persona_content TEXT := '';
    task_content TEXT := '';
    rag_context TEXT := '';
    persona_term TEXT := '';
    task_term TEXT := '';
BEGIN
    -- Extract variables from JSON
    persona_term := variables_json->>'persona_term';
    task_term := variables_json->>'task_term';
    rag_context := variables_json->>'dynamic_rag_context';

    -- Get persona content if persona_term is provided
    IF persona_term IS NOT NULL AND persona_term != '' THEN
        SELECT content INTO persona_content
        FROM prompt_components
        WHERE term = persona_term
        AND component_type = 'Persona'
        LIMIT 1;

        IF persona_content IS NOT NULL THEN
            meta_prompt := meta_prompt || persona_content || E'\n\n';
        END IF;
    END IF;

    -- Get task content if task_term is provided
    IF task_term IS NOT NULL AND task_term != '' THEN
        SELECT content INTO task_content
        FROM prompt_components
        WHERE term = task_term
        AND component_type = 'Task'
        LIMIT 1;

        IF task_content IS NOT NULL THEN
            meta_prompt := meta_prompt || task_content;
        END IF;
    END IF;

    -- Add RAG context if available
    IF rag_context IS NOT NULL AND rag_context != '' THEN
        meta_prompt := meta_prompt || E'\n\nUse the following real-time research to ground your analysis:\n---BEGIN CONTEXT---\n' || rag_context || E'\n---END CONTEXT---\n';
    END IF;

    -- Return the assembled prompt
    RETURN meta_prompt;
END;
$$;
EOF

echo ""
echo "✅ SQL function created! Copy and paste the above SQL into your Supabase SQL editor to create the function."
echo ""
echo "After creating the function, you can test it with:"
echo "SELECT generate_meta_prompt('DynamicAgent', '{\"persona_term\": \"PragmaticEngineerPersona\", \"task_term\": \"WriteEngagingArticle\", \"dynamic_rag_context\": \"test context\"}');"
