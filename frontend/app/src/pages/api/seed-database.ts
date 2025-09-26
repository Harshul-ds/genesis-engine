// src/pages/api/seed-database.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

const samplePersonas = [
  {
    term: 'PragmaticEngineerPersona',
    description: 'A practical software engineer focused on clean code and efficient solutions',
    content: 'You are a pragmatic software engineer with 10+ years of experience. You focus on writing clean, maintainable code that solves real problems efficiently. You prioritize practical solutions over theoretical perfection, but always ensure code quality and scalability.',
    component_type: 'Persona'
  },
  {
    term: 'CreativeDesignerPersona',
    description: 'A creative UX/UI designer who thinks about user experience first',
    content: 'You are a creative UX/UI designer with a passion for user-centered design. You think deeply about user psychology, visual hierarchy, and creating delightful experiences. You balance aesthetics with functionality.',
    component_type: 'Persona'
  },
  {
    term: 'BusinessStrategistPersona',
    description: 'A strategic business thinker focused on market analysis and growth',
    content: 'You are a strategic business consultant with expertise in market analysis, competitive strategy, and business development. You focus on identifying opportunities, analyzing market trends, and developing actionable growth strategies.',
    component_type: 'Persona'
  },
  {
    term: 'EducatorPersona',
    description: 'An experienced educator who excels at breaking down complex topics',
    content: 'You are an experienced educator and curriculum designer with a talent for making complex topics accessible and engaging. You focus on learning outcomes, progressive skill building, and creating materials that cater to different learning styles.',
    component_type: 'Persona'
  },
  {
    term: 'ResearcherPersona',
    description: 'A meticulous researcher who values data and evidence-based approaches',
    content: 'You are a meticulous researcher with a PhD-level understanding of research methodology. You value empirical evidence, rigorous analysis, and systematic approaches to problem-solving. You excel at literature reviews and data interpretation.',
    component_type: 'Persona'
  }
];

const sampleTasks = [
  {
    term: 'TechnicalDocumentationTask',
    description: 'Create comprehensive technical documentation and guides',
    content: 'Create detailed technical documentation including API references, setup guides, troubleshooting manuals, and best practices documentation.',
    component_type: 'Task'
  },
  {
    term: 'BusinessAnalysisTask',
    description: 'Conduct market research and competitive analysis',
    content: 'Perform comprehensive market research, competitive analysis, SWOT assessments, and strategic recommendations for business development.',
    component_type: 'Task'
  },
  {
    term: 'ContentCreationTask',
    description: 'Develop engaging content for various platforms and audiences',
    content: 'Create compelling content including blog posts, social media content, marketing copy, educational materials, and thought leadership pieces.',
    component_type: 'Task'
  },
  {
    term: 'ProductDesignTask',
    description: 'Design user experiences and product interfaces',
    content: 'Design user interfaces, user experiences, wireframes, prototypes, and conduct user research to create intuitive and engaging products.',
    component_type: 'Task'
  },
  {
    term: 'EducationalContentTask',
    description: 'Develop educational materials and learning experiences',
    content: 'Create courses, tutorials, workshops, training materials, and educational resources that effectively teach complex topics.',
    component_type: 'Task'
  }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Simple security check - in production, use proper authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer seed_')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        console.log('🌱 Starting database seeding via API...');

        // Clear existing data
        await supabaseAdmin.from('prompt_components').delete().neq('id', 0);

        // Insert personas
        const { data: personasData, error: personasError } = await supabaseAdmin
            .from('prompt_components')
            .insert(samplePersonas);

        if (personasError) {
            throw new Error(`Failed to insert personas: ${personasError.message}`);
        }

        // Insert tasks
        const { data: tasksData, error: tasksError } = await supabaseAdmin
            .from('prompt_components')
            .insert(sampleTasks);

        if (tasksError) {
            throw new Error(`Failed to insert tasks: ${tasksError.message}`);
        }

        console.log('✅ Database seeded successfully via API!');
        console.log(`📊 Inserted ${(personasData?.length || 0)} personas and ${(tasksData?.length || 0)} tasks`);

        res.status(200).json({
            success: true,
            message: 'Database seeded successfully',
            data: {
                personas: personasData?.length || 0,
                tasks: tasksData?.length || 0
            }
        });

    } catch (error: any) {
        console.error('❌ Database seeding failed:', error);
        res.status(500).json({
            error: 'Failed to seed database',
            message: error.message
        });
    }
}
