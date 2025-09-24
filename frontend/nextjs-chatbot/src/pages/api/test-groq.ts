// src/pages/api/test-groq.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getBestGroqModel, groq } from '../../lib/groqClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const modelToUse = await getBestGroqModel();

        console.log(`Testing Groq API with dynamically selected model: ${modelToUse}` );

        const completion = await groq.chat.completions.create({
            model: modelToUse,
            messages: [{ role: "user", content: "Explain what an LPU is in one sentence." }],
        });

        const answer = completion.choices[0].message.content;
        console.log("Groq test successful.");

        res.status(200).json({ success: true, model_used: modelToUse, answer: answer });

    } catch (error: any) {
        console.error("Groq test failed:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}
