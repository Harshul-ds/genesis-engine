#!/bin/bash

# Script to create the get_initial_app_data database function
# Run this with: chmod +x create_initial_data_function.sh && ./create_initial_data_function.sh

echo "Creating get_initial_app_data database function..."

# You can run this SQL in your Supabase SQL editor or via psql
cat << 'EOF'
CREATE OR REPLACE FUNCTION get_initial_app_data()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Fetch all the initial data needed for the app
    SELECT jsonb_build_object(
        'personas', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', p.id,
                    'name', p.name,
                    'term', p.term,
                    'content', p.content,
                    'component_type', p.component_type,
                    'created_at', p.created_at,
                    'updated_at', p.updated_at
                )
            )
            FROM prompt_components p
            WHERE p.component_type = 'Persona'
        ), '[]'::jsonb),

        'tasks', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', t.id,
                    'name', t.name,
                    'term', t.term,
                    'content', t.content,
                    'component_type', t.component_type,
                    'created_at', t.created_at,
                    'updated_at', t.updated_at
                )
            )
            FROM prompt_components t
            WHERE t.component_type = 'Task'
        ), '[]'::jsonb),

        'prompt_components', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', pc.id,
                    'name', pc.name,
                    'term', pc.term,
                    'content', pc.content,
                    'component_type', pc.component_type,
                    'created_at', pc.created_at,
                    'updated_at', pc.updated_at
                )
            )
            FROM prompt_components pc
        ), '[]'::jsonb)
    ) INTO result;

    RETURN result;
END;
$$;
EOF

echo ""
echo "✅ SQL function created! Copy and paste the above SQL into your Supabase SQL editor to create the function."
echo ""
echo "After creating the function, you can test it with:"
echo "SELECT get_initial_app_data();"
