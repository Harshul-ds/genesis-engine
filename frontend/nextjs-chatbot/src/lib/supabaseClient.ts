// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetches the entire initial dataset (personas, tasks, prompt_components)
 * from the Supabase RPC function 'get_initial_app_data' in a single call.
 * This is the bridge between our frontend code and our database function.
 */
export const getInitialData = async () => {
  // Use the '.rpc()' method from the Supabase client to call a database function.
  // The string 'get_initial_app_data' MUST EXACTLY match the name of the SQL
  // function you created in the Supabase Editor.
  const { data, error } = await supabase.rpc('get_initial_app_data');

  // This is crucial error handling. If the call fails for any reason
  // (e.g., network issue, permissions error), it will log the detailed
  // error to the developer console and stop the app from crashing.
  if (error) {
    console.error("Supabase RPC Error fetching initial data:", error.message);
    throw new Error("Failed to fetch the initial application data from Supabase.");
  }

  // If the call is successful, log a success message to the console
  // and return the data that was fetched from the database.
  console.log("✅ Bridge to Supabase function 'get_initial_app_data' is working. Data received.");
  return data;
};
