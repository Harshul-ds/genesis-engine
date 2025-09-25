//src/lib/clientTools.ts

// Defines the structure of a single prompt component record
export interface PromptComponent {
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

// A "Tool" to suggest goals based on topic and personas
export async function suggestGoals(appData: AppData, topic: string, personas: string[]): Promise<string[] | string> {
  console.log(`🤖 ACTION: Suggesting goals for topic: ${topic} with personas: ${personas.join(', ')}`);

  try {
    // For now, return some intelligent defaults based on the topic
    // In a real implementation, this could call an AI service or use predefined templates

    const baseGoals = [
      `Create a comprehensive business plan for ${topic}`,
      `Write a detailed technical guide about ${topic}`,
      `Develop marketing content and strategy for ${topic}`,
      `Design an educational course on ${topic}`,
      `Build a product roadmap for ${topic} solutions`,
      `Create research documentation for ${topic}`,
      `Develop case studies and examples for ${topic}`,
      `Design user experience flows for ${topic} applications`
    ];

    // Add persona-specific goals if personas are provided
    if (personas.length > 0) {
      const personaGoals = personas.flatMap(persona =>
        appData.personas
          .filter(p => p.term === persona)
          .map(p => {
            switch (p.term) {
              case 'PragmaticEngineerPersona':
                return `Design technical architecture for ${topic} systems`;
              case 'CreativeDesignerPersona':
                return `Create visual design concepts for ${topic} interfaces`;
              case 'BusinessStrategistPersona':
                return `Develop market analysis and strategy for ${topic}`;
              case 'EducatorPersona':
                return `Design educational materials and curriculum for ${topic}`;
              case 'ResearcherPersona':
                return `Conduct research methodology for ${topic} studies`;
              default:
                return `Apply ${p.term} perspective to ${topic} development`;
            }
          })
      );
      baseGoals.push(...personaGoals);
    }

    // Return top 5 most relevant goals
    return baseGoals.slice(0, 5);
  } catch (error) {
    console.error('Goal suggestion error:', error);
    return `Error: Failed to suggest goals for '${topic}'. ${error.message}`;
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
  suggestGoals,
};
