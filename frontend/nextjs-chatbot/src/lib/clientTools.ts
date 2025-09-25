//src/lib/clientTools.ts

// Defines the structure of a single prompt component record
interface PromptComponent {
  id: number;
  term: string;
  content: string;
  description: string;
  component_type: 'Persona' | 'Task' | 'Qualifier' | 'Constraint' | 'Format';
  // Add any other fields you might use here
}

// Defines the structure of the entire appData object
export interface AppData {
  personas: PromptComponent[];
  tasks: PromptComponent[];
  prompt_components: PromptComponent[];
}

// Search result interface for web scraping
export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

// A "Tool" to get a list of all available persona terms
export function listAvailablePersonas(appData: AppData): string[] {
  console.log("🤖 ACTION: Listing all available personas.");
  return appData.personas.map(p => p.term);
}

// A "Tool" to get the full details (including the 'content' prompt) for a specific persona
export function getPersonaDetails(appData: AppData, personaTerm: string): PromptComponent | string {
  console.log(`🤖 ACTION: Getting details for persona: ${personaTerm}` );
  const persona = appData.personas.find(p => p.term.toLowerCase() === personaTerm.toLowerCase());
  return persona || `Error: Persona named '${personaTerm}' was not found.` ;
}

// A "Tool" to get a list of all available task terms
export function listAvailableTasks(appData: AppData): string[] {
    console.log("🤖 ACTION: Listing all available tasks.");
    return appData.tasks.map(t => t.term);
}

// A "Tool" to get the full details for a specific task
export function getTaskDetails(appData: AppData, taskTerm: string): PromptComponent | string {
  console.log(`🤖 ACTION: Getting details for task: ${taskTerm}` );
  const task = appData.tasks.find(t => t.term.toLowerCase() === taskTerm.toLowerCase());
  return task || `Error: Task named '${taskTerm}' was not found.` ;
}

// A "Tool" to search the web using DuckDuckGo scraping (server-side)
export async function searchTheWeb(query: string): Promise<SearchResult[] | string> {
  console.log(`🤖 ACTION: Searching the web for: ${query}`);

  try {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    const results = await response.json();
    return results;
  } catch (error) {
    console.error('Search error:', error);
    return `Error: Failed to search the web for '${query}'. ${error.message}`;
  }
}

// This is a "tool belt" object that maps the function names (as strings) to the actual functions.
// The AI will generate the name, and we will use this object to call the correct function.
export const toolbelt = {
  listAvailablePersonas,
  getPersonaDetails,
  listAvailableTasks,
  getTaskDetails,
  searchTheWeb,
};
