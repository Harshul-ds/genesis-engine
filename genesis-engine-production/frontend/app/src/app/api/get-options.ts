// src/pages/api/get-options.ts
import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';

// Use the ANON key for this safe, public, read-only operation
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Fallback data when database is empty
const fallbackPersonas = [
    {
        term: 'PragmaticEngineerPersona',
        description: 'A practical software engineer focused on clean code and efficient solutions',
        content: 'You are a pragmatic software engineer with 10+ years of experience. You focus on writing clean, maintainable code that solves real problems efficiently. You prioritize practical solutions over theoretical perfection, but always ensure code quality and scalability.'
    },
    {
        term: 'CreativeDesignerPersona',
        description: 'A creative UX/UI designer who thinks about user experience first',
        content: 'You are a creative UX/UI designer with a passion for user-centered design. You think deeply about user psychology, visual hierarchy, and creating delightful experiences. You balance aesthetics with functionality.'
    },
    {
        term: 'BusinessStrategistPersona',
        description: 'A strategic business thinker focused on market analysis and growth',
        content: 'You are a strategic business consultant with expertise in market analysis, competitive strategy, and business development. You focus on identifying opportunities, analyzing market trends, and developing actionable growth strategies.'
    },
    {
        term: 'EducatorPersona',
        description: 'An experienced educator who excels at breaking down complex topics',
        content: 'You are an experienced educator and curriculum designer with a talent for making complex topics accessible and engaging. You focus on learning outcomes, progressive skill building, and creating materials that cater to different learning styles.'
    },
    {
        term: 'ResearcherPersona',
        description: 'A meticulous researcher who values data and evidence-based approaches',
        content: 'You are a meticulous researcher with a PhD-level understanding of research methodology. You value empirical evidence, rigorous analysis, and systematic approaches to problem-solving. You excel at literature reviews and data interpretation.'
    }
];

const fallbackTasks = [
    {
        term: 'TechnicalDocumentationTask',
        description: 'Create comprehensive technical documentation and guides',
        content: 'Create detailed technical documentation including API references, setup guides, troubleshooting manuals, and best practices documentation.'
    },
    {
        term: 'BusinessAnalysisTask',
        description: 'Conduct market research and competitive analysis',
        content: 'Perform comprehensive market research, competitive analysis, SWOT assessments, and strategic recommendations for business development.'
    },
    {
        term: 'ContentCreationTask',
        description: 'Develop engaging content for various platforms and audiences',
        content: 'Create compelling content including blog posts, social media content, marketing copy, educational materials, and thought leadership pieces.'
    },
    {
        term: 'ProductDesignTask',
        description: 'Design user experiences and product interfaces',
        content: 'Design user interfaces, user experiences, wireframes, prototypes, and conduct user research to create intuitive and engaging products.'
    },
    {
        term: 'EducationalContentTask',
        description: 'Develop educational materials and learning experiences',
        content: 'Create courses, tutorials, workshops, training materials, and educational resources that effectively teach complex topics.'
    }
];

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

        // If database is empty, return fallback data
        const personas = personasRes.data && personasRes.data.length > 0 ? personasRes.data : fallbackPersonas;
        const tasks = tasksRes.data && tasksRes.data.length > 0 ? tasksRes.data : fallbackTasks;

        res.status(200).json({
            personas: personas,
            tasks: tasks
        });
    } catch (error: any) {
        // If there's an error (like RLS policy), return fallback data
        console.log('⚠️ Database query failed, using fallback data:', error.message);
        res.status(200).json({
            personas: fallbackPersonas,
            tasks: fallbackTasks
        });
    }
}
