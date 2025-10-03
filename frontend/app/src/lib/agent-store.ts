// src/lib/agent-store.ts
import { create } from 'zustand';
import { generateText } from 'ai';
import { fireworks } from '@ai-sdk/fireworks';
import { AppData, Step, ApiModel, PromptComponent, GeneratedPrompt, AgentStreamEvent } from './types';

// =========================================================================
// THE CORRECT PARSING LOGIC
// This is a helper function that correctly decodes the Vercel AI SDK stream format.
// =========================================================================
const parseAIStreamChunk = (chunk: string): string => {
  return chunk
    .split('\n') // A single chunk can have multiple lines
    .filter(line => line.startsWith('0:')) // We only care for the data lines
    .map(line => {
      try {
        // Remove the '0:' prefix and then JSON.parse the rest of the string
        // This correctly handles escaped characters like \" and \n
        return JSON.parse(line.substring(2));
      } catch (e) {
        return ''; // Ignore any malformed lines
      }
    })
    .join(''); // Join the clean text from all lines in the chunk
};

export interface FinalPromptCard {
  personaTerm: string;
  prompt: string;
  output?: string; // The output will be populated when the user clicks "Execute"
  isGeneratingPrompt: boolean; // Whether the initial prompt is being generated
  isGeneratingOutput: boolean; // Whether the output is being generated
  executionModel: string; // ✨ NEW: The model to use for this specific card
  status: 'queued' | 'generating-prompt' | 'generating-output' | 'complete' | 'error'; // ✨ NEW: Status tracking
}

// ==============================================================================
// 1. STATE DEFINITION (Adding live history)
// ==============================================================================
interface AgentState {
  // --- CORE WIZARD STATE ---
  currentStep: Step;
  isAppLoading: boolean;
  appData: AppData | null;
  agentError: string | null;

  // --- DYNAMIC DATA STATE ---
  models: ApiModel[];
  suggestedTopics: string[];

  // --- USER INPUT STATE ---
  topic: string;
  goal: string;
  selectedPersonas: string[];
  selectedModel: string;

  // --- LOADING STATE ---
  isLoadingTopics: boolean;
  isLoadingGoals: boolean;
  isLoadingPersonas: boolean;
  isGenerating: boolean;

  // --- AI-GENERATED STATE ---
  suggestedGoals: string[];
  suggestedPersonas: any[];
  // --- OUTPUT STATE ---
  finalPrompts: FinalPromptCard[]; // Now using our new card type

  // --- NEW FOR PHASE 5 ---
  liveHistory: AgentStreamEvent[];

  // ✨ SIMPLIFIED STATE: We only need one 'thoughts' variable now.
  agentThoughts: string;
  generationResult: string;
  // START ADDITION 1: New state variables for the autonomous agent
  isAutonomous: boolean;
  autonomousStatus: string;
  // END ADDITION 1

  // ✨ NEW: A log to show the agent's work
  agentLog: string[];

  // --- NEW FOR THEME SYSTEM ---
  theme: 'light' | 'dark'; // ✨ NEW: To track the current theme

  // ✨ NEW: Session history and saved prompts for sidebar
  sessionHistory: AgentStreamEvent[];
  savedPrompts: GeneratedPrompt[];
}

// ==============================================================================
// 2. ACTIONS DEFINITION
// All the functions that can change the state. These are the "verbs".
// ==============================================================================
interface AgentActions {
  // --- INITIALIZATION ---
  initializeApp: (appData: AppData) => Promise<void>;

  // --- SETTERS ---
  setTopic: (topic: string) => void;
  setGoal: (goal: string) => void;
  setSelectedModel: (modelId: string) => void;
  setCardExecutionModel: (personaTerm: string, modelId: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;

  // --- WIZARD NAVIGATION & LOGIC ---
  handleTopicSubmit: () => Promise<void>;
  handleGoalSubmit: () => Promise<void>;
  togglePersonaSelection: (personaTerm: string) => void;
  handlePersonasSubmit: () => void;
  handleModelSubmit: () => void;

  // --- NEW ACTIONS for the sophisticated workflow ---
  generateFinalPrompt: () => Promise<void>;
  generateSinglePrompt: (personaTerm: string) => Promise<void>;
  generatePromptCards: () => Promise<void>;
  executePromptCard: (index: number) => Promise<void>;
  executePrompt: (prompt: string, personaTerm: string) => Promise<void>;
  logAgentMessage: (message: string) => void;
  processPromptQueue: () => void;
  reset: () => void;
  // START ADDITION 2: Orchestrator action
  runAutonomousWorkflow: (initialTopic: string) => Promise<void>;
  // END ADDITION 2
}

// ==============================================================================
// 3. STORE CREATION
// Combining state and actions into the final Zustand store.
// ==============================================================================
export const useAgentStore = create<AgentState & AgentActions>((set, get) => ({
  // --- INITIAL STATE VALUES (Adding liveHistory) ---
  currentStep: 'topic',
  isAppLoading: true,
  appData: null,
  agentError: null,
  models: [],
  suggestedTopics: [],
  topic: '',
  goal: '',
  selectedPersonas: [],
  selectedModel: '',
  isLoadingTopics: false,
  isLoadingGoals: false,
  isLoadingPersonas: false,
  isGenerating: false,
  suggestedGoals: [],
  suggestedPersonas: [],
  finalPrompts: [],
  liveHistory: [],
  agentThoughts: '',
  generationResult: '',
  // START ADDITION 1: New state defaults
  isAutonomous: false,
  autonomousStatus: '',
  // END ADDITION 1

  // ✨ NEW: Initialize agent log
  agentLog: [],

  // --- NEW FOR THEME SYSTEM ---
  theme: 'dark', // ✨ NEW: Default theme is dark

  // ✨ NEW: Session history and saved prompts for sidebar
  sessionHistory: [],
  savedPrompts: [],

  // --- ACTION IMPLEMENTATIONS ---

  /**
   * Initializes the application. Fetches DYNAMIC models and topic suggestions.
   */
  initializeApp: async (appData: AppData) => {
    try {
      set({ isAppLoading: true, appData, agentError: null, isLoadingTopics: true });

      const [modelsResponse, topicsResponse] = await Promise.all([
        fetch('/api/list-models'),
        fetch('/api/suggest-topics')
      ]);

      if (!modelsResponse.ok) throw new Error('Failed to fetch AI models.');
      if (!topicsResponse.ok) throw new Error('Failed to fetch initial topic suggestions.');

      const modelData: ApiModel[] = await modelsResponse.json();
      const topicData = await topicsResponse.json();

      const defaultModelId = modelData.length > 0 ? modelData[0].id : '';

      set({
        models: modelData,
        selectedModel: defaultModelId,
        suggestedTopics: topicData,
        isAppLoading: false,
        isLoadingTopics: false
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      console.error("App initialization failed:", errorMessage);
      set({
        isAppLoading: false,
        isLoadingTopics: false,
        agentError: `Could not initialize application: ${errorMessage}`,
        suggestedTopics: [
          'Sustainable fashion and eco-friendly textiles',
          'AI-powered personal finance management',
          'Remote work productivity tools',
          'Mental health and wellness apps',
          'Blockchain applications in supply chain',
          'Renewable energy storage solutions',
          'Autonomous vehicle safety systems',
          'Personalized learning platforms'
        ]
      });
    }
  },

  /**
   * Updates the topic in the state as the user types.
   */
  setTopic: (topic: string) => {
    set({ topic });
  },

  /**
   * Updates the goal in the state.
   */
  setGoal: (goal: string) => {
    set({ goal });
  },

  /**
   * Updates the user's selected model in the state.
   */
  setSelectedModel: (modelId: string) => {
    set({ selectedModel: modelId });
  },

  /**
   * Updates the execution model for a specific card
   */
  setCardExecutionModel: (personaTerm: string, modelId: string) => {
    set(state => ({
      finalPrompts: state.finalPrompts.map(card =>
        card.personaTerm === personaTerm
          ? { ...card, executionModel: modelId }
          : card
      )
    }));
  },

  /**
   * Centralized logger for agent transparency
   */
  logAgentMessage: (message: string) => {
    set(state => ({ agentLog: [...state.agentLog, message] }));
  },

  /**
   * ✨ NEW: Add the theme-setting action
   */
  setTheme: (theme: 'light' | 'dark') => set({ theme }),

  processPromptQueue: () => {
    const { finalPrompts } = get();
    const queuedCards = finalPrompts.filter(card => card.status === 'queued');

    if (queuedCards.length > 0) {
      const firstCard = queuedCards[0];
      get().generateSinglePrompt(firstCard.personaTerm);
    }
  },

  /**
   * Handles the submission of the topic.
   * Calls the backend to get DYNAMIC goal suggestions.
   */
  handleTopicSubmit: async () => {
    const { topic } = get();
    if (!topic.trim()) return;

    set({ isLoadingGoals: true, agentError: null, suggestedGoals: [] });

    try {
      const response = await fetch('/api/suggest-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate goals.');
      }

      const generatedGoals = await response.json();

      set({
        suggestedGoals: generatedGoals,
        isLoadingGoals: false,
        currentStep: 'goals',
        // If we're running autonomously, automatically select the first goal
        ...(get().isAutonomous ? { goal: generatedGoals[0] } : {})
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate goals.";
      console.error("Goal suggestion failed:", errorMessage);
      set({ isLoadingGoals: false, agentError: errorMessage });
    }
  },

  /**
   * Handles the submission of goals and moves to personas step.
   * Now uses intelligent persona suggestions based on topic and goal.
   */
  handleGoalSubmit: async () => {
    const { topic, goal, appData } = get();
    if (!goal.trim() || !appData) return;

    set({ isLoadingPersonas: true, agentError: null });

    try {
      const response = await fetch('/api/suggest-personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          goal,
          allPersonas: appData.personas
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to suggest personas.');
      }

      const suggestedPersonas = await response.json();

      set({
        suggestedPersonas,
        isLoadingPersonas: false,
        currentStep: 'personas',
        // If we're running autonomously, automatically select the first persona
        ...(get().isAutonomous ? { selectedPersonas: [suggestedPersonas[0].term] } : {})
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load personas.";
      console.error("Persona suggestion failed:", errorMessage);
      set({ isLoadingPersonas: false, agentError: errorMessage });
    }
  },

  /**
   * Adds or removes a persona from the user's selection.
   */
  togglePersonaSelection: (personaTerm: string) => {
    const { selectedPersonas } = get();
    const newSelection = selectedPersonas.includes(personaTerm)
      ? selectedPersonas.filter(p => p !== personaTerm) // Remove if exists
      : [...selectedPersonas, personaTerm]; // Add if doesn't exist
    set({ selectedPersonas: newSelection });
  },

  /**
   * Finalizes the persona selection and moves to the final configuration step.
   * ✨ FIX: Now creates prompt cards with proper execution model and status
   */
  handlePersonasSubmit: () => {
    const { selectedPersonas, selectedModel } = get();
    if (selectedPersonas.length === 0) {
      console.warn("No personas selected. Please select at least one.");
      return;
    }

    const promptCards: FinalPromptCard[] = selectedPersonas.map(personaTerm => ({
      personaTerm,
      prompt: '',
      status: 'queued' as const,
      isGeneratingPrompt: false,
      isGeneratingOutput: false,
      executionModel: selectedModel, // ✨ FIX: Use the selected model for each card
    }));

    set({ finalPrompts: promptCards, currentStep: 'results' });
    setTimeout(() => get().processPromptQueue(), 100);
  },

  /**
   * STEP 1: GENERATE INITIAL THOUGHTS
   */
  generateThoughts: async () => {
    const { selectedModel, topic, goal, selectedPersonas } = get();
    set({ currentStep: 'refinement', agentError: null, agentThoughts: '' });

    try {
      const thoughtsPrompt = `
        As a world-class prompt engineer, think step-by-step about how to construct the best possible prompt.
        Your task is to synthesize the perspectives of a "team" of AI personas.

        Lay out your reasoning for how you will combine their unique viewpoints to address the user's goal.
        Consider how each persona's expertise complements the others. Do NOT generate the final prompt yet.

        The user's input is:
        - Topic: "${topic}"
        - Goal: "${goal}"
        - The Team of Personas: "${selectedPersonas.join(', ')}"

        Explain:
        1. How each persona's expertise will contribute
        2. How their perspectives will be synthesized
        3. The structure you'll use to blend their insights
      `;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          history: [{ role: 'user', content: thoughtsPrompt }],
        }),
      });

      if (!response.ok || !response.body) throw new Error('API Error during thought generation.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const decodedChunk = decoder.decode(value);
        const cleanText = parseAIStreamChunk(decodedChunk);

        set((state) => ({ agentThoughts: state.agentThoughts + cleanText }));
      }

    } catch (error: any) {
      set({ agentError: error.message, currentStep: 'model' });
    }
  },

  /**
   * ✨ RENAMED ACTION: This is now clearer.
   */
  setAgentThoughts: (thoughts: string) => set({ agentThoughts: thoughts }),

  /**
   * STEP 2: GENERATE THE FINAL PROMPT USING THE REFINED THOUGHTS
   */
  generateFinalPrompt: async () => {
    const { selectedModel, topic, goal, selectedPersonas, agentThoughts } = get();
    set({ currentStep: 'generating', agentError: null, generationResult: '' });

    try {
      const finalPromptInstruction = `
        Using the following thought process as your guide:
        ---THOUGHTS---
        ${agentThoughts}
        ---
        Now, generate the final, copy-pasteable prompt in Markdown format.

        **CRITICAL INSTRUCTIONS:**
        1. **Synthesize Perspectives:** The prompt must seamlessly integrate the viewpoints of all selected personas: **${selectedPersonas.join(', ')}**.
        2. **Be Concise and Dense:** The entire prompt must be **no more than 300 words**. Focus on information density and clarity.
        3. **Address the Goal:** The prompt must be laser-focused on achieving: "${goal}" for the topic "${topic}".

        Format the prompt for maximum clarity and impact, but keep the total length under 300 words.
      `;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          history: [{ role: 'user', content: finalPromptInstruction }],
        }),
      });

      if (!response.ok || !response.body) throw new Error('API Error during final prompt generation.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let fullPromptResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const decodedChunk = decoder.decode(value);
        const cleanText = parseAIStreamChunk(decodedChunk);
        fullPromptResponse += cleanText;
        set((state) => ({ generationResult: state.generationResult + cleanText }));
      }

      set({ currentStep: 'results', generationResult: fullPromptResponse });

    } catch (error: any) {
      set({ agentError: error.message, currentStep: 'refinement' });
    }
  },

  /**
   * Finalizes the model selection and moves to results step.
   * Now creates prompt cards for parallel generation.
   */
  handleModelSubmit: async () => {
    if (!get().isAutonomous) {
      get().generatePromptCards();
      return;
    }

    try {
      await get().generatePromptCards();
      set({ currentStep: 'results', isAutonomous: false, autonomousStatus: 'Workflow Complete!' });
    } catch (error: any) {
      const errMsg = error instanceof Error ? error.message : 'Autonomous generation failed.';
      console.error('Autonomous handleModelSubmit error:', errMsg);
      set({ agentError: errMsg, isAutonomous: false });
    }
  },

  // START ADDITION 2: The new orchestrator action
  runAutonomousWorkflow: async (initialTopic: string) => {
    if (get().isAutonomous) return;

    set({
      isAutonomous: true,
      topic: initialTopic,
      autonomousStatus: 'Initializing Agent...',
      currentStep: 'topic',
    });

    const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

    try {
      set({ autonomousStatus: 'Determining goals...' });
      await wait(1000);

      await get().handleTopicSubmit();

      const suggestedGoals = get().suggestedGoals;
      if (suggestedGoals.length === 0) {
        throw new Error("No goals were suggested by the AI.");
      }

      set({ autonomousStatus: 'Analyzing best personas...' });
      await wait(1000);

      await get().handleGoalSubmit();

      const selectedPersonas = get().selectedPersonas;
      if (selectedPersonas.length === 0) {
        throw new Error("No personas were suggested by the AI.");
      }

      const suggestedPersonas = get().suggestedPersonas;
      if (suggestedPersonas.length === 0) {
        throw new Error("No personas were suggested by the AI.");
      }

      set({
        selectedPersonas: suggestedPersonas.slice(0, 3).map(p => p.term),
        autonomousStatus: 'Building your expert team...'
      });

      await wait(1000);
      set({
        autonomousStatus: 'Selecting optimal model...',
        selectedModel: get().models.length > 0 ? get().models[0].id : get().selectedModel,
        currentStep: 'model'
      });

      await wait(1000);
      set({ autonomousStatus: 'Preparing to generate...' });
      await get().handleModelSubmit();

    } catch (error: any) {
      console.error("Autonomous agent failed:", error);
      set({ agentError: 'The autonomous agent failed.', isAutonomous: false });
    }
  },

  /**
   * ✨ FIXED: Generates a prompt for a single persona, using the card's specific model
   */
  generateSinglePrompt: async (personaTerm: string) => {
    set(state => ({
      finalPrompts: state.finalPrompts.map(p =>
        p.personaTerm === personaTerm ? { ...p, status: 'generating-prompt' } : p
      )
    }));
    get().logAgentMessage(`Generating prompt for ${personaTerm}...`);

    const { topic, goal, selectedPersonas, selectedModel } = get();
    const card = get().finalPrompts.find(p => p.personaTerm === personaTerm);
    if (!card || !card.executionModel) {
      throw new Error(`Model not found for persona ${personaTerm}`);
    }

    try {
      // ✨ THE NEW, DYNAMIC LOGIC STARTS HERE ✨

      // Step 1: Classify the user's goal.
      // We ask a fast, cheap model to categorize the goal into "Execution" (doing something)
      // or "Composition" (writing something).
      const { text: goalType } = await generateText({
        model: fireworks('accounts/fireworks/models/llama-v3p1-8b-instruct'), // Fast & cheap model for classification
        prompt: `Classify the following user goal. Does it describe a task that requires EXECUTION (e.g., building a plan, creating a dataset, running an analysis) or COMPOSITION (e.g., writing an article, drafting a report, creating content)? Respond with ONLY the word "EXECUTION" or "COMPOSITION".

User Goal: "${goal}"`,
      });

      get().logAgentMessage(`Goal classified as: ${goalType.trim()}`);

      // Step 2: Construct the appropriate prompt based on the goal type.
      let finalPromptInstruction;

      if (goalType.trim().toUpperCase() === 'EXECUTION') {
        // For execution tasks, we use the direct, command-oriented prompt.
        finalPromptInstruction = `
          Your SOLE function is to act as the **${personaTerm}** and execute a plan to achieve the user's goal.

          **Project:**
          - Topic: "${topic}"
          - Goal: "${goal}"
          - Your Team: ${selectedPersonas.join(', ')}

          **Your Task:**
          Generate the tangible 'Deliverables' that YOU are responsible for. Invent any necessary data to create a realistic example. Do not explain the process; perform it. Generate the output directly.

          ---
          **BEGIN EXECUTION IMMEDIATELY.**
        `;
      } else { // Default to 'COMPOSITION'
        // For composition tasks, we ask the AI to structure a high-quality prompt for another AI.
        finalPromptInstruction = `
          Your primary role is the **${personaTerm}**.

          Generate a high-quality, dense prompt (max 300 words) that outlines YOUR SPECIFIC contribution to the team's goal.

          **Project:**
          - Topic: "${topic}"
          - Goal: "${goal}"
          - Your Team: ${selectedPersonas.filter(p => p !== personaTerm).join(', ')}

          Frame the prompt as a set of instructions for another AI that will execute ONLY YOUR part of the project. Detail the inputs you need, the process to follow, and the concrete deliverables.
        `;
      }

      // Step 3: Fetch the response with the dynamically chosen prompt.
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: card.executionModel, // Use the correct model from the card
          history: [{ role: 'user', content: finalPromptInstruction }],
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`API error for ${personaTerm}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let isFirstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const cleanText = parseAIStreamChunk(decoder.decode(value));

        set(state => ({
          finalPrompts: state.finalPrompts.map(p => {
            if (p.personaTerm === personaTerm) {
              const newPrompt = isFirstChunk ? cleanText : p.prompt + cleanText;
              isFirstChunk = false;
              return { ...p, prompt: newPrompt };
            }
            return p;
          })
        }));
      }

      set(state => ({
        finalPrompts: state.finalPrompts.map(p =>
          p.personaTerm === personaTerm ? { ...p, status: 'complete' } : p
        ),
      }));

      get().logAgentMessage(`Prompt for ${personaTerm} complete.`);

    } catch (error: any) {
      get().logAgentMessage(`Error for ${personaTerm}: ${error.message}`);
      set(state => ({
        finalPrompts: state.finalPrompts.map(p =>
          p.personaTerm === personaTerm ? { ...p, prompt: `Error: ${error.message}`, status: 'error' } : p
        ),
      }));
    } finally {
      // ✨ CRITICAL: After this card is done (success or fail), process the next one.
      get().processPromptQueue();
    }
  },

  /**
   * STEP 1: GENERATE PROMPT CARDS
   * This is our new action that replaces the old generateThoughts
   */
  generatePromptCards: async () => {
    const { selectedPersonas, selectedModel } = get();

    set({ isGenerating: true, agentError: null });

    try {
      // Initialize the prompt cards with loading states
      const initialCards = selectedPersonas.map(persona => ({
        personaTerm: persona,
        prompt: "Generating prompt for " + persona + "...",
        output: undefined,
        isGeneratingPrompt: true,
        isGeneratingOutput: false,
        executionModel: selectedModel, // ✨ FIX: Use the selected model for each card
        status: 'generating-prompt' as const
      }));

      set({ finalPrompts: initialCards });

      // Generate prompts for each persona
      const promptPromises = selectedPersonas.map(persona =>
        get().generateSinglePrompt(persona)
      );

      await Promise.all(promptPromises);

      set({ isGenerating: false, currentStep: 'results' });

    } catch (error: any) {
      console.error('Failed to generate prompts:', error);
      set({
        isGenerating: false,
        agentError: error.message || 'Failed to generate prompts.',
        currentStep: 'model'
      });
    }
  },

  /**
   * Executes a prompt card and updates its output
   */
  executePromptCard: async (index: number) => {
    const { finalPrompts, selectedModel } = get();
    const card = finalPrompts[index];
    if (!card || card.isGeneratingOutput) return;

    set({
      finalPrompts: finalPrompts.map((c, i) =>
        i === index ? { ...c, isGeneratingOutput: true, status: 'generating-output' } : c
      )
    });

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          history: [{ role: 'user', content: card.prompt }],
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to generate output');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let output = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const decodedChunk = decoder.decode(value);
        const cleanText = parseAIStreamChunk(decodedChunk);
        output += cleanText;

        set({
          finalPrompts: finalPrompts.map((c, i) =>
            i === index ? { ...c, output } : c
          )
        });
      }

      set({
        finalPrompts: finalPrompts.map((c, i) =>
          i === index ? { ...c, output, isGeneratingOutput: false, status: 'complete' } : c
        )
      });

    } catch (error: any) {
      console.error('Failed to execute prompt:', error);

      set({
        finalPrompts: finalPrompts.map((c, i) =>
          i === index ? { ...c, output: 'Error: ' + error.message, isGeneratingOutput: false, status: 'error' } : c
        ),
        agentError: error.message || 'Failed to execute prompt'
      });
    }
  },

  /**
   * Executes a prompt for a specific persona using the card's specific model
   */
  executePrompt: async (prompt: string, personaTerm: string) => {
    const { finalPrompts } = get();
    const index = finalPrompts.findIndex(card => card.personaTerm === personaTerm);
    if (index === -1 || finalPrompts[index].isGeneratingOutput) return;

    set({
      finalPrompts: finalPrompts.map((c, i) =>
        i === index ? { ...c, isGeneratingOutput: true, status: 'generating-output' } : c
      )
    });

    const card = finalPrompts[index];
    get().logAgentMessage(`Executing prompt for ${personaTerm} using ${card.executionModel.split('/').pop()}...`);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: card.executionModel, // ✨ FIX: Use the card's specific model
          history: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to generate output');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let output = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const decodedChunk = decoder.decode(value);
        const cleanText = parseAIStreamChunk(decodedChunk);
        output += cleanText;

        set({
          finalPrompts: finalPrompts.map((c, i) =>
            i === index ? { ...c, output } : c
          )
        });
      }

      set({
        finalPrompts: finalPrompts.map((c, i) =>
          i === index ? { ...c, output, isGeneratingOutput: false, status: 'complete' } : c
        )
      });

      get().logAgentMessage(`Execution for ${personaTerm} complete.`);

    } catch (error: any) {
      console.error('Failed to execute prompt:', error);

      set({
        finalPrompts: finalPrompts.map((c, i) =>
          i === index ? { ...c, output: 'Error: ' + error.message, isGeneratingOutput: false, status: 'error' } : c
        ),
        agentError: error.message || 'Failed to execute prompt'
      });
    }
  },

  /**
   * Resets the entire wizard to its initial state for a new session.
   */
  reset: () => {
    set({
      currentStep: 'topic',
      topic: '',
      goal: '',
      selectedPersonas: [],
      selectedModel: '',
      suggestedGoals: [],
      suggestedPersonas: [],
      finalPrompts: [],
      agentError: null,
      liveHistory: [],
      agentThoughts: '',
      generationResult: '',
      isAutonomous: false,
      autonomousStatus: '',
      agentLog: [],
      sessionHistory: [],
      savedPrompts: [],
      theme: 'dark', // ✨ NEW: Reset to default theme
    });
  }
}));
