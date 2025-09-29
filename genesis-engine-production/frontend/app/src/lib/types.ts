/**
 * Defines the exact shape of the JSON object that the client MUST send
 * in the body of a POST request to our /api/generate endpoint.
 */
export interface GenerateRequest {
  /**
   * The unique name of the prompt template to use.
   * This will be used to look up the "recipe" in our Supabase table.
   * @example "TechnicalComparisonBlogPost"
   */
  goal: string;

  /**
   * A flexible dictionary holding the dynamic values to be injected
   * into the prompt components. The keys should match placeholders
   * in the component's 'content' field.
   * @example { "concept_a": "DynamoDB", "concept_b": "Elasticsearch" }
   */
  variables: { [key: string]: any };
}

/**
 * Defines the exact shape of the JSON object that our API PROMISES to return
 * upon a successful request.
 */
export interface GenerateResponse {
  /**
   * The final, generated text output from the LLM.
   */
  final_answer: string;

  /**
   * The full, assembled "meta-prompt" that was sent to the LLM.
   * This is incredibly useful for debugging, logging, and showing users "our work".
   */
  meta_prompt_used: string;
}

/**
 * Defines the exact shape of the JSON object that the client MUST send
 * in the body of a POST request to our /api/generate endpoint.
 */
export interface GenerateRequest {
  /**
   * The unique name of the prompt template to use.
   * This will be used to look up the "recipe" in our Supabase table.
   * @example "TechnicalComparisonBlogPost"
   */
  goal: string;

  /**
   * A flexible dictionary holding the dynamic values to be injected
   * into the prompt components. The keys should match placeholders
   * in the component's 'content' field.
   * @example { "concept_a": "DynamoDB", "concept_b": "Elasticsearch" }
   */
  variables: { [key: string]: any };
}

/**
 * Defines the exact shape of the JSON object that our API PROMISES to return
 * upon a successful request.
 */
export interface GenerateResponse {
  /**
   * The final, generated text output from the LLM.
   */
  final_answer: string;

  /**
   * The full, assembled "meta-prompt" that was sent to the LLM.
   * This is incredibly useful for debugging, logging, and showing users "our work".
   */
  meta_prompt_used: string;
}

// ==============================================================================
// NEW ARCHITECTURAL TYPES FOR THE REFACTORED APPLICATION
// ==============================================================================

// Keep the existing clientTools interfaces for compatibility
export interface PromptComponent {
  id: number;
  term: string;
  content: string;
  description: string;
  component_type: 'Persona' | 'Task' | 'Qualifier' | 'Constraint' | 'Format';
}

export interface AppData {
  personas: PromptComponent[];
  tasks: PromptComponent[];
  prompt_components: PromptComponent[];
}

// Defines the possible steps in our new user flow wizard.
export type Step = 'topic' | 'goals' | 'personas' | 'model' | 'generating' | 'results';

// Represents a clean, filtered AI model object from the Fireworks API.
// This is the "contract" our backend provides to the frontend.
export interface ApiModel {
  id: string;
  name: string;
  object?: string;
  created?: number;
  owned_by?: string;
}

// Represents the structure of AI-generated prompts
export interface GeneratedPrompt {
  id: string;
  title: string;
  content: string;
  persona: string; // The persona this prompt was generated for
  model?: string;
  timestamp?: string;
}

/**
 * Represents a single event streamed from the agent during execution.
 * This allows the UI to show a live, step-by-step feed of the agent's work.
 */
export interface AgentStreamEvent {
  id: string;
  type: 'thought' | 'action' | 'observation' | 'result' | 'error';
  payload: {
    text: string;
    details?: any; // For structured data like tool outputs
  };
  timestamp: number;
}
