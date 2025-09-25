// src/hooks/useReActAgent.ts
import { useState } from 'react';
import { toolbelt, AppData, PromptComponent, SearchResult } from '../lib/clientTools';

// Define all the types we'll use in our polished implementation
export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface PromptData {
  title: string;
  personaUsed: string;
  prompt: string;
}

export interface AssemblyState {
  status: string;
  persona: PromptComponent | null;
  webContext: SearchResult[] | null;
  currentThought: string;
}

// A simple utility to force a small delay, allowing React to render updates.
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useReActAgent = (appData: AppData) => {
  const [history, setHistory] = useState<AgentMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [finalPrompts, setFinalPrompts] = useState<PromptData[]>([]);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [liveAssembly, setLiveAssembly] = useState<AssemblyState>({
    status: "Idle",
    persona: null,
    webContext: null,
    currentThought: "",
  });

  // NEW: Event-based streaming function that handles structured events
  const getAiEventStream = async (currentHistory: AgentMessage[], model: string, onEvent: (event: { type: string, payload: any }) => void) => {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history: currentHistory, model }),
    });

    if (!response.body) throw new Error("Response body is null");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataString = line.substring(6).trim();
          if (dataString === '[DONE]') return;

          try {
            const event = JSON.parse(dataString);
            onEvent(event); // Pass the full event object to the handler
          } catch (e) {
            console.error("Failed to parse event:", dataString);
          }
        }
      }
    }
  };

  // Enhanced ReAct loop that uses event-based streaming
  const runReActLoop = async (currentHistory: AgentMessage[], model: string) => {
    try {
      // Reset assembly state for new thought
      setLiveAssembly({
        status: "Agent is thinking...",
        persona: null,
        webContext: null,
        currentThought: "",
      });

      let fullThought = "";
      let hasUsedTool = false;

      await getAiEventStream(currentHistory, model, (event) => {
        // This is our new event handler - the core of the hybrid streaming model
        switch (event.type) {
          case 'thought_chunk':
            fullThought += event.payload.text;
            setLiveAssembly(prev => ({
              ...prev,
              currentThought: prev.currentThought + event.payload.text
            }));
            break;

          case 'stream_end':
            console.log("AI has finished generating its thought.");
            break;

          case 'error':
            console.error("Stream error:", event.payload.message);
            setAgentError(event.payload.message);
            setIsThinking(false);
            break;
        }
      });

      if (fullThought.includes('Action:')) {
        hasUsedTool = true;
        const actionString = fullThought.split('Action:')[1].trim();
        const functionName = actionString.substring(0, actionString.indexOf('('));
        const argsString = actionString.substring(actionString.indexOf('(') + 1, actionString.lastIndexOf(')'));
        const args = argsString.split(',').map(arg => arg.trim().replace(/['"`]/g, ''));

        let observation = `Error: Tool '${functionName}' not found.`;
        if (toolbelt[functionName]) {
          const result = await toolbelt[functionName](appData, ...args);
          observation = `Observation: ${JSON.stringify(result)}`;

          // Update live assembly based on the tool used
          if (functionName === 'getPersonaDetails') {
            const persona = result as PromptComponent;
            if (persona && typeof persona === 'object' && persona.term) {
              setLiveAssembly(prev => ({
                ...prev,
                status: `Found Persona: ${persona.term}`,
                persona: persona
              }));
            }
          } else if (functionName === 'searchTheWeb') {
            const searchResults = result as SearchResult[];
            setLiveAssembly(prev => ({
              ...prev,
              status: "Found web context...",
              webContext: searchResults
            }));
          }
        }

        const observationHistory: AgentMessage[] = [...currentHistory, { role: 'assistant' as const, content: fullThought }, { role: 'system' as const, content: observation }];
        await sleep(50);
        runReActLoop(observationHistory, model);
      } else {
        // End of loop - the thought is the final answer
        console.log("Agent's final thought:", fullThought);

        const cleanedThought = fullThought.replace(/```json\n|` ``/g, '');

        // ==============================================================================
        // THE HYBRID STREAMING MAGIC:
        // We instantly update the final prompts in one single action for low latency
        // ==============================================================================
        try {
          const parsedPrompts = JSON.parse(cleanedThought);
          setFinalPrompts(parsedPrompts);
        } catch (e) {
          console.error("Failed to parse final JSON:", cleanedThought);
          setAgentError("The AI returned a malformed JSON response.");
        }

        setIsThinking(false);
        setLiveAssembly(prev => ({ ...prev, status: "Complete!" }));
      }
    } catch (e) {
      console.error("ReAct loop error:", e);
      setAgentError(`An error occurred during generation: ${e.message}`);
      setIsThinking(false);
      setLiveAssembly(prev => ({ ...prev, status: "Error!" }));
    }
  };

  // NEW: Dedicated refinement loop for single prompt refinement
  const runRefinementLoop = async (currentHistory: AgentMessage[], model: string) => {
    try {
      // Reset assembly state for refinement
      setLiveAssembly({
        status: "Refining prompt...",
        persona: null,
        webContext: null,
        currentThought: "",
      });

      let fullThought = "";

      await getAiEventStream(currentHistory, model, (event) => {
        switch (event.type) {
          case 'thought_chunk':
            fullThought += event.payload.text;
            setLiveAssembly(prev => ({
              ...prev,
              currentThought: prev.currentThought + event.payload.text
            }));
            break;

          case 'stream_end':
            console.log("AI has finished refining the prompt.");
            break;

          case 'error':
            console.error("Refinement error:", event.payload.message);
            setAgentError(event.payload.message);
            setIsThinking(false);
            break;
        }
      });

      if (fullThought.includes('Action:')) {
        // Handle tool usage in refinement (less common but possible)
        const actionString = fullThought.split('Action:')[1].trim();
        const functionName = actionString.substring(0, actionString.indexOf('('));
        const argsString = actionString.substring(actionString.indexOf('(') + 1, actionString.lastIndexOf(')'));
        const args = argsString.split(',').map(arg => arg.trim().replace(/['"`]/g, ''));

        let observation = `Error: Tool '${functionName}' not found.`;
        if (toolbelt[functionName]) {
          const result = await toolbelt[functionName](appData, ...args);
          observation = `Observation: ${JSON.stringify(result)}`;

          if (functionName === 'searchTheWeb') {
            const searchResults = result as SearchResult[];
            setLiveAssembly(prev => ({
              ...prev,
              status: "Researching for refinement...",
              webContext: searchResults
            }));
          }
        }

        const observationHistory: AgentMessage[] = [...currentHistory, { role: 'assistant' as const, content: fullThought }, { role: 'system' as const, content: observation }];
        await sleep(50);
        runRefinementLoop(observationHistory, model);
      } else {
        // End of refinement loop - expect a single JSON object
        console.log("Refinement complete:", fullThought);

        const cleanedThought = fullThought.replace(/```json\n|` ``/g, '');

        try {
          // CRITICAL: Refinement expects a single object, not an array
          const refinedPromptObject = JSON.parse(cleanedThought);

          // Add the new, refined prompt to the existing list
          setFinalPrompts(prev => [...prev, refinedPromptObject]);
        } catch (e) {
          console.error("Failed to parse refined prompt JSON:", cleanedThought);
          setAgentError("The AI returned a malformed refinement response.");
        }

        setIsThinking(false);
        setLiveAssembly(prev => ({ ...prev, status: "Refinement Complete!" }));
      }
    } catch (e) {
      console.error("Refinement loop error:", e);
      setAgentError(`An error occurred during refinement: ${e.message}`);
      setIsThinking(false);
      setLiveAssembly(prev => ({ ...prev, status: "Refinement Error!" }));
    }
  };

  const run = (topic: string, goal: string, selectedPersonas: string[], model: string) => {
    setAgentError(null);
    setIsThinking(true);
    setFinalPrompts([]);

    let personaInstructions = '';
    const allPersonaTerms = appData.personas.map(p => p.term);

    if (selectedPersonas.length === 0) {
      personaInstructions = `First, generate one distinct prompt for EACH of the following available personas: ${allPersonaTerms.join(', ')}.`;
    } else {
      personaInstructions = `First, generate one distinct prompt for EACH of the following user-selected personas: ${selectedPersonas.join(', ')}.`;
    }

    const initialPrompt = `You are an expert Prompt Generation Assistant. Your goal is to create a list of diverse, high-quality prompts based on a user's topic and goal.
The user's goal is: "${goal}".
The user's topic is: "${topic}".
${personaInstructions}
For each prompt, you MUST use the 'searchTheWeb' tool to get real-time context on the topic. Combine the persona and web context to create the prompt.
Your final output MUST be a valid JSON array of objects. Each object in the array must have exactly three keys:
1. "title": A short, creative, and engaging title for the prompt.
2. "personaUsed": The exact 'term' of the persona used to generate this prompt (e.g., "PragmaticEngineerPersona").
3. "prompt": The full, final, generated prompt text.
Do not include any other text, explanation, or markdown formatting in your final response. Your response must be only the JSON array.`;

    const initialHistory: AgentMessage[] = [{ role: 'user' as const, content: initialPrompt }];
    runReActLoop(initialHistory, model);
  };

  const refine = (prompt: PromptData, model: string) => {
    setAgentError(null);
    setIsThinking(true);

    const refinePrompt = `You are an expert Prompt Refinement Assistant. Please take the following prompt and improve it by making it more specific, actionable, and effective:

Original Prompt:
Title: ${prompt.title}
Persona: ${prompt.personaUsed}
Prompt: ${prompt.prompt}

Please provide an improved version of this prompt that:
1. Is more specific and actionable
2. Has better context and examples
3. Is more engaging and effective
4. Maintains the same persona and core purpose

Your final output MUST be a valid JSON array containing exactly one object with the same structure:
{
  "title": "Improved title",
  "personaUsed": "${prompt.personaUsed}",
  "prompt": "The improved prompt text"
}
Do not include any other text, explanation, or markdown formatting in your final response. Your response must be only the JSON array.`;

    const initialHistory: AgentMessage[] = [{ role: 'user' as const, content: refinePrompt }];
    runRefinementLoop(initialHistory, model);
  };

  return { run, refine, history, isThinking, finalPrompts, agentError, setAgentError, liveAssembly };
};
