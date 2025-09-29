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

// A "Tool" to suggest random topics using Tavily AI research
export async function suggestRandomTopics(query?: string): Promise<string[] | string> {
  console.log('🤖 ACTION: Suggesting random topics using Tavily AI');

  try {
    const tavilyApiKey = process.env.TAVILY_API_KEY;
    if (!tavilyApiKey) {
      throw new Error('TAVILY_API_KEY is not configured');
    }

    const searchQuery = query || 'suggest interesting and diverse topics for content creation, research, or business ideas';
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query: searchQuery,
        search_depth: 'basic',
        include_answer: true,
        include_images: false,
        include_raw_content: false,
        max_results: 10,
        include_domains: []
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API request failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Extract topics from the search results
    const topics: string[] = [];

    // Use the AI-generated answer if available
    if (data.answer) {
      // Parse the answer to extract topic suggestions
      const answerText = data.answer.toLowerCase();
      const sentences = answerText.split(/[.!?]+/).filter(s => s.trim().length > 10);

      for (const sentence of sentences.slice(0, 8)) {
        // Look for patterns that suggest topics
        if (sentence.includes('topic') || sentence.includes('idea') || sentence.includes('concept')) {
          const cleanSentence = sentence.replace(/^(the|a|an)\s+/i, '').trim();
          if (cleanSentence.length > 15 && cleanSentence.length < 100) {
            topics.push(cleanSentence.charAt(0).toUpperCase() + cleanSentence.slice(1));
          }
        }
      }
    }

    // Fallback to using search result titles as topics
    if (topics.length < 5 && data.results) {
      for (const result of data.results.slice(0, 8)) {
        if (result.title && result.title.length > 15 && result.title.length < 100) {
          topics.push(result.title);
        }
      }
    }

    // Ensure we have at least some topics
    if (topics.length === 0) {
      topics.push(
        'Sustainable technology innovations',
        'Digital transformation strategies',
        'Creative content marketing',
        'Educational technology trends',
        'Business process optimization'
      );
    }

    // Return the first 8 topics
    return topics.slice(0, 8);
  } catch (error) {
    console.error('Topic suggestion error:', error);
    return `Error: Failed to suggest topics. ${error.message}`;
  }
}

// A "Tool" to list available AI models from Fireworks API
export async function listAvailableModels(): Promise<any[] | string> {
  console.log('🤖 ACTION: Listing available AI models');

  try {
    const response = await fetch('/api/list-models', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const models = await response.json();
    return models;
  } catch (error) {
    console.error('Model listing error:', error);
    return `Error: Failed to list models. ${error.message}`;
  }
}

// A "Tool" to suggest goals based on topic and personas
export async function suggestGoals(appData: AppData, topic: string, personas: string[]): Promise<string[] | string> {
  console.log(`🤖 ACTION: Suggesting goals for topic: ${topic} with personas: ${personas.join(', ')}`);

  try {
    const baseGoals = [
      `Create a comprehensive business plan for ${topic}`,
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

    // Return top 8 most relevant goals (increased from 5)
    return baseGoals.slice(0, 8);
  } catch (error) {
    console.error('Goal suggestion error:', error);
    return `Error: Failed to suggest goals for '${topic}'. ${error.message}`;
  }
}

// Retry mechanism for API calls
export const retryApiCall = async (
  apiCall: () => Promise<any>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<any> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;

      // Don't retry on certain errors
      if (
        error.response?.status === 401 ||
        error.response?.status === 403 ||
        error.response?.status === 400 ||
        error.name === 'AbortError'
      ) {
        throw error;
      }

      if (attempt < maxRetries) {
        console.log(`API call failed (attempt ${attempt}/${maxRetries}), retrying...`);
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError;
};

// This is a "tool belt" object that maps the function names (as strings) to the actual functions.
// The AI will generate the name, and we will use this object to call the correct function.
export const toolbelt = {
  listAvailablePersonas,
  getPersonaDetails,
  listAvailableTasks,
  getTaskDetails,
  searchTheWeb,
  suggestRandomTopics,
  suggestGoals,
  listAvailableModels,
};
