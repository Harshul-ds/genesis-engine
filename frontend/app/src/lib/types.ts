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
