// src/lib/providers/fireworks.ts
export class FireworksProvider {
    private readonly modelId: string;

    constructor(modelId: string) {
        this.modelId = modelId;
    }

    async generateCompletion(prompt: string): Promise<ReadableStream> {
        const response = await fetch('https://api.fireworks.ai/inference/v1/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.FIREWORKS_API_KEY}`
            },
            body: JSON.stringify({
                model: this.modelId,
                prompt,
                temperature: 0.7,
                max_tokens: 500,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error('Failed to generate completion');
        }

        return response.body as ReadableStream;
    }
}