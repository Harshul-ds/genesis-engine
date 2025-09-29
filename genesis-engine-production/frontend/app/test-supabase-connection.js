// A simple script to test the Supabase connection and table visibility.
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' }); // Load the environment variables

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("--- Supabase Connection Test ---");

// 1. Check if the environment variables were loaded
if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ CRITICAL ERROR: Supabase URL or Anon Key is missing from your .env.local file.");
    process.exit(1);
}
console.log("✅ Environment variables loaded successfully.");
console.log("   - Supabase URL:", supabaseUrl);

// 2. Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log("✅ Supabase client initialized.");

// 3. The Core Test: Try to fetch data from one of your tables.
//    We are using a simple query to get the 'count' which is very lightweight.
async function runTest() {
    console.log("\nAttempting to query 'prompt_components' table...");
    try {
        const { data, error, count } = await supabase
            .from('prompt_components')
            .select('*', { count: 'exact', head: true }); // 'head: true' makes it faster, we only need the count

        if (error) {
            // This is the most important part for debugging
            console.error("❌ CONNECTION FAILED. Supabase returned an error:");
            console.error("   - Message:", error.message);
            console.error("   - Hint:", error.hint);
            console.error("   - Code:", error.code);
            return;
        }

        console.log("✅✅✅ SUCCESS! Connection to Supabase is working.");
        console.log(`   - Successfully saw the 'prompt_components' table.` );
        console.log(`   - The table has an estimated ${count} rows.` );

    } catch (e) {
        console.error("❌ CRITICAL ERROR: An unexpected error occurred during the test.", e);
    }
}

runTest();
