// check-env.js
// A standalone script to verify all external API connections.

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

// A list of checks to run
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
        name: "Groq API Connection",
        check: async () => {
            const key = process.env.GROQ_API_KEY;
            if (!key) throw new Error("Groq API Key is missing.");

            const groq = new OpenAI({ apiKey: key, baseURL: 'https://api.groq.com/openai/v1' });
            await groq.models.list();
            return "Connection successful. Able to list models.";
        }
    },
    // Add a check for Pinecone here if/when you build the ingestion script
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
        process.exit(0); // Exit with success code
    } else {
        console.error("🔥 One or more checks failed. Please fix the errors above before starting the server.");
        process.exit(1); // Exit with failure code
    }
}

runAllChecks();
