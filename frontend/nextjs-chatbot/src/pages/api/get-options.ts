// src/pages/api/get-options.ts
import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';

// Use the ANON key for this safe, public, read-only operation
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    try {
        // Fetch all personas and tasks in parallel for efficiency
        const [personasRes, tasksRes] = await Promise.all([
            supabase.from('prompt_components').select('term, description, content').eq('component_type', 'Persona'),
            supabase.from('prompt_components').select('term, description, content').eq('component_type', 'Task')
        ]);

        if (personasRes.error) throw personasRes.error;
        if (tasksRes.error) throw tasksRes.error;

        res.status(200).json({
            personas: personasRes.data,
            tasks: tasksRes.data
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
