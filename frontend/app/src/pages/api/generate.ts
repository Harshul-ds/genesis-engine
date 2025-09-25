// src/pages/api/generate.ts
import { NextApiRequest, NextApiResponse } from 'next';

const HF_API_BASE_URL = "https://api-inference.huggingface.co/models/"\;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const hfToken = process.env.HUGGINGFACE_TOKEN;
  if (!hfToken) {
    console.error("[generate.ts] CRITICAL ERROR: HUGGINGFACE_TOKEN is not configured.");
    return res.status(500).json({ error: 'Hugging Face token not configured.' });
  }

  const { history, model } = req.body; 

  if (!model) {
    return res.status(400).json({ error: 'Model ID is required.' });
  }
  
  const modelUrl = `${HF_API_BASE_URL}${model}` ;
  console.log(`[generate.ts] Calling Hugging Face Inference API at: ${modelUrl}` );

  // This is the specific chat template required by Llama 3 and many other instruct models.
  let prompt = "<|begin_of_text|>";
  history.forEach(msg => {
    const role = msg.role === 'system' ? 'user' : msg.role;
    prompt += `<|start_header_id|>${role}<|end_header_id|>\n\n${msg.content}<|eot_id|>` ;
  });
  prompt += `<|start_header_id|>assistant<|end_header_id|>\n\n` ;

  try {
    const response = await fetch(modelUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken}` ,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 1024,
          return_full_text: false,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Hugging Face API Error for model ${model}:` , errorData);
      return res.status(response.status).json({ 
        error: `Failed to get response from Hugging Face model: ${model}` , 
        details: errorData 
      });
    }

    const data = await response.json();
    const generatedText = data[0]?.generated_text || "";
    
    console.log(`[generate.ts] Successfully received response from ${model}.` );
    res.status(200).json({ text: generatedText.trim() });

  } catch (error) {
    console.error(`Error calling Hugging Face model ${model}:` , error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
}
