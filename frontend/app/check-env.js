// check-env.js
// A standalone script to verify all essential external API connections.

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { HfInference } = require('@huggingface/inference');

const checks = [
    {
        name: "Supabase Connection",
        check: async () => {
            const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
            if (!url || !key) throw new Error("Supabase URL or Anon Key is missing.");

            const supabase = createClient(url, key);
            const { error, count } = await supabase.from('prompt_components').select('*', { count: 'exact', head: true });

            if (error) throw new Error(error.message);
            return `Connected successfully. Found ${count} prompt components.` ;
        }
    },
    {
        name: "Fireworks AI Inference Check",
        check: async () => {
            const fireworksKey = process.env.FIREWORKS_API_KEY;
            if (!fireworksKey) throw new Error("FIREWORKS_API_KEY is missing from .env.local");

            // We will make a direct fetch call to the Fireworks API endpoint.
            // This is the most reliable way to check the key and service status.
            const FIREWORKS_API_URL = "https://api.fireworks.ai/inference/v1/chat/completions";
            const testModel = "accounts/fireworks/models/llama-v3p1-8b-instruct";

            const response = await fetch(FIREWORKS_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${fireworksKey}` ,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: testModel,
                    messages: [{ role: 'user', content: 'Health check' }],
                    max_tokens: 5,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API request failed: ${response.status} - ${errorText}` );
            }

            return "Connection successful. API is available and key is valid.";
        }
    },
];

async function runAllChecks() {
    console.log("--- Running Pre-Flight Environment Checks ---");
    let allPassed = true;

    for (const { name, check } of checks) {
        try {
            const result = await check();
            console.log(`✅ [PASS] ${name}: ${result}` );
        } catch (error) {
            console.error(`❌ [FAIL] ${name}: ${error.message}` );
            allPassed = false;
        }
    }

    console.log("-------------------------------------------");
    if (allPassed) {
        console.log("🎉 All systems are go! Your environment is configured correctly.");
        process.exit(0);
    } else {
        console.error("🔥 One or more checks failed. Please fix the errors above before starting the server.");
        process.exit(1);
    }
}

runAllChecks();
