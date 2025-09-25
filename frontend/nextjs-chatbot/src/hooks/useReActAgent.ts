// src/hooks/useReActAgent.ts

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toolbelt, AppData } from '../lib/clientTools'; // Your client-side functions

// Interface for a single message in the conversation history
export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const getAiResponse = async (history: AgentMessage[], model: string) => {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ history, model }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API request failed: ${errorText}` );
  }
  return response.json();
};

export const useReActAgent = (appData: AppData) => {
  const [history, setHistory] = useState<AgentMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [finalPrompts, setFinalPrompts] = useState<string[]>([]);
  const [agentError, setAgentError] = useState<string | null>(null);

  const agentMutation = useMutation({
    mutationFn: ({ history, model }: { history: AgentMessage[], model: string }) => getAiResponse(history, model),
    onSuccess: async (response, { model }) => {
      const thought = response.text;
      const newHistory: AgentMessage[] = [...history, { role: 'assistant', content: thought }];

      // Simple parsing: Does the AI's thought contain an action to take?
      if (thought.includes('Action:')) {
        setHistory(newHistory); // Update history with the "thought"
        const actionString = thought.split('Action:')[1].trim();
        const functionName = actionString.substring(0, actionString.indexOf('('));
        const argsString = actionString.substring(actionString.indexOf('(') + 1, actionString.lastIndexOf(')'));
        const args = argsString.split(',').map(arg => arg.trim().replace(/['"`]/g, ''));

        let observation = `Error: Tool '${functionName}' not found.` ;
        if (toolbelt[functionName]) {
          try {
            // Execute the client-side tool. Handle async tools like searchTheWeb.
            const result = await toolbelt[functionName](appData, ...args);
            observation = `Observation: ${JSON.stringify(result)}` ;
          } catch (e) {
            observation = `Error executing tool: ${e.message}` ;
          }
        }
        
        const observationHistory: AgentMessage[] = [...newHistory, { role: 'system', content: observation }];
        setHistory(observationHistory);
        // Continue the loop by calling the mutation again with the new observation
        agentMutation.mutate({ history: observationHistory, model: model });
      } else {
        // If there's no action, the thought is the final answer
        try {
            // The agent's final output should be a JSON array of strings
            const parsedPrompts = JSON.parse(thought);
            setFinalPrompts(parsedPrompts);
        } catch (e) {
            console.error("Failed to parse final JSON output from AI:", thought);
            setFinalPrompts(["Error: The AI did not return a valid JSON array of prompts."]);
        }
        setHistory(newHistory);
        setIsThinking(false);
      }
    },
    onError: (error) => {
      const errorMessage = error.message;
      console.error("AI Mutation error:", errorMessage);

      // Check for our specific, recoverable error
      if (errorMessage.includes("The model")) {
        // Set a specific, helpful error message
        setAgentError(`The selected model is not available or is currently offline. Please choose a different one.` );
      } else {
        // For all other errors, show a generic message
        setAgentError(`A critical error occurred: ${errorMessage}` );
      }

      // In both cases, stop the "thinking" process
      setIsThinking(false);
    }
  });

  const run = (topic: string, selectedPersonas: string[], model: string) => {
    // Clear any previous errors when starting a new run
    setAgentError(null);
    setIsThinking(true);
    setFinalPrompts([]);
    
    let personaInstructions = '';
    const allPersonaTerms = appData.personas.map(p => p.term);

    if (selectedPersonas.length === 0) {
      personaInstructions = `First, generate one distinct prompt for EACH of the following available personas: ${allPersonaTerms.join(', ')}.` ;
    } else {
      personaInstructions = `First, generate one distinct prompt for EACH of the following user-selected personas: ${selectedPersonas.join(', ')}.` ;
    }

    const initialPrompt = `You are an expert Prompt Generation Assistant. Your goal is to create a list of diverse, high-quality prompts based on a user's topic. The user's topic is: "${topic}". ${personaInstructions} For each prompt, you MUST use the 'searchTheWeb' tool to get real-time context on the topic. Combine the persona, task, and web context to create a final, expert-level prompt. Your final output MUST be a valid JSON array of strings, where each string is a complete prompt. Do not include any other text or explanation in your final response.` ;
    
    const initialHistory: AgentMessage[] = [{ role: 'user', content: initialPrompt }];
    setHistory(initialHistory);
    agentMutation.mutate({ history: initialHistory, model: model }); // Pass model to backend
  };

  return { run, history, isThinking, finalPrompts, agentError, setAgentError };
};
