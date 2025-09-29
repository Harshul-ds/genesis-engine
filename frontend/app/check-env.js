// check-env.js
// A comprehensive environment validation script for Vercel deployment.

require('dotenv').config({ path: '.env.local' });

const checks = [
    {
        name: "Supabase Configuration",
        required: true,
        check: async () => {
            const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
            if (!url || !key) throw new Error("Supabase URL or Anon Key is missing.");

            // Basic URL validation
            try {
                new URL(url);
            } catch (e) {
                throw new Error("Invalid Supabase URL format.");
            }

            return `✅ Supabase configured: ${url}`;
        }
    },
    {
        name: "Fireworks AI Configuration",
        required: true,
        check: async () => {
            const fireworksKey = process.env.FIREWORKS_API_KEY;
            if (!fireworksKey) throw new Error("FIREWORKS_API_KEY is missing from environment variables");

            if (fireworksKey.length < 20) {
                throw new Error("FIREWORKS_API_KEY appears to be invalid (too short)");
            }

            return "✅ Fireworks AI API key configured";
        }
    },
    {
        name: "Tavily AI Configuration",
        required: true,
        check: async () => {
            const tavilyKey = process.env.TAVILY_API_KEY;
            if (!tavilyKey) throw new Error("TAVILY_API_KEY is missing from environment variables");

            if (tavilyKey.length < 20) {
                throw new Error("TAVILY_API_KEY appears to be invalid (too short)");
            }

            return "✅ Tavily AI API key configured";
        }
    },
    {
        name: "Optional: OpenAI Configuration",
        required: false,
        check: async () => {
            const openaiKey = process.env.OPENAI_API_KEY;
            if (!openaiKey) return "⚠️  OpenAI API key not configured (optional)";

            if (openaiKey.length < 20) {
                throw new Error("OPENAI_API_KEY appears to be invalid (too short)");
            }

            return "✅ OpenAI API key configured (optional)";
        }
    },
    {
        name: "Optional: Google AI Configuration",
        required: false,
        check: async () => {
            const googleKey = process.env.GOOGLE_AI_API_KEY;
            if (!googleKey) return "⚠️  Google AI API key not configured (optional)";

            if (googleKey.length < 20) {
                throw new Error("GOOGLE_AI_API_KEY appears to be invalid (too short)");
            }

            return "✅ Google AI API key configured (optional)";
        }
    }
    // Removed database connection test for production deployment
];

async function runAllChecks() {
    console.log("🚀 Genesis Engine - Environment Validation");
    console.log("============================================");
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log("");

    let allPassed = true;
    let requiredPassed = true;

    for (const { name, required, check } of checks) {
        try {
            const result = await check();
            const icon = required ? '✅' : '✅';
            console.log(`${icon} [${required ? 'REQUIRED' : 'OPTIONAL'}] ${name}: ${result}`);
        } catch (error) {
            const icon = required ? '❌' : '⚠️';
            console.error(`${icon} [${required ? 'REQUIRED' : 'OPTIONAL'}] ${name}: ${error.message}`);

            if (required) {
                allPassed = false;
                requiredPassed = false;
            }
        }
    }

    console.log("");
    console.log("============================================");

    if (requiredPassed) {
        console.log("🎉 All required systems are configured correctly!");
        console.log("✅ Your Genesis Engine is ready for Vercel deployment.");
        process.exit(0);
    } else {
        console.error("🔥 Required configuration issues found.");
        console.error("❌ Please fix the errors above before deploying to Vercel.");
        process.exit(1);
    }
}

runAllChecks();
