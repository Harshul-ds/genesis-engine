// src/pages/api/list-models.ts
import { NextApiRequest, NextApiResponse } from 'next';

// This is our expert-curated list of top-tier US and Chinese models that are
// available on the Hugging Face Inference API and work well with our setup.
const CURATED_MODELS = [
  { id: "meta-llama/Meta-Llama-3.1-8B-Instruct", name: "Meta LLaMA 3.1 (US)" },
  { id: "google/gemma-2-9b-it", name: "Google Gemma 2 (US)" },
  { id: "microsoft/Phi-3-mini-4k-instruct", name: "Microsoft Phi-3 (US)" },
  { id: "Qwen/Qwen2-7B-Instruct", name: "Alibaba Qwen2 (China)" },
  { id: "01-ai/Yi-1.5-9B-Chat", name: "01.AI Yi-1.5 (China)" },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // This endpoint is now very simple. It no longer needs to call an external API.
  // It just returns our curated list of high-quality models.
  console.log('[list-models] Returning curated list of Hugging Face models.');
  res.status(200).json(CURATED_MODELS);
}
