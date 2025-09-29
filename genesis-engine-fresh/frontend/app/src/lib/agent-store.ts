// src/lib/agent-store.ts
'use client';

import { create } from 'zustand';
import { AppData, Step, ApiModel, PromptComponent, GeneratedPrompt, AgentStreamEvent } from './types';

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
  suggestedPersonas: PromptComponent[];

  // --- OUTPUT STATE ---
  finalPrompts: GeneratedPrompt[];

  // --- NEW FOR PHASE 5 ---
  liveHistory: AgentStreamEvent[];
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

  // --- WIZARD NAVIGATION & LOGIC ---
  handleTopicSubmit: () => Promise<void>;
  handleGoalSubmit: () => Promise<void>;
  togglePersonaSelection: (personaTerm: string) => void;
  handlePersonasSubmit: () => void;
  handleModelSubmit: () => void;
  reset: () => void;
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
        currentStep: 'goals'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate goals.";
      console.error("Goal suggestion failed:", errorMessage);
      set({ isLoadingGoals: false, agentError: errorMessage });
    }
  },

  /**
   * Handles the submission of goals and moves to personas step.
   */
  handleGoalSubmit: async () => {
    const { goal, appData } = get();
    if (!goal.trim()) return;

    set({ isLoadingPersonas: true, agentError: null });

    try {
      // Generate persona suggestions based on topic and goal
      if (appData) {
        // For now, use all available personas as suggestions
        // In the future, this could be more intelligent
        const personaSuggestions = appData.personas.map((persona: PromptComponent, index: number) => ({
          id: persona.id || index, // Use existing id or generate one
          term: persona.term,
          description: persona.description,
          content: persona.content,
          component_type: persona.component_type
        }));

        set({
          suggestedPersonas: personaSuggestions,
          isLoadingPersonas: false,
          currentStep: 'personas'
        });
      } else {
        throw new Error('App data not available');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load personas.";
      console.error("Persona loading failed:", errorMessage);
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
   */
  handlePersonasSubmit: () => {
    const { selectedPersonas } = get();
    if (selectedPersonas.length === 0) {
      // You could show a toast or error here, but for now we just prevent moving on.
      console.warn("No personas selected. Please select at least one.");
      return;
    }
    set({ currentStep: 'model' });
  },

  /**
   * Submits the final configuration and begins the REAL AI generation process.
   * NOTE: This now expects a streaming response from the backend API.
   */
  handleModelSubmit: async () => {
    const { topic, goal, selectedPersonas, selectedModel } = get();

    // Final validation before we start the expensive generation task
    if (!topic || !goal || selectedPersonas.length === 0 || !selectedModel) {
      const errorMessage = "Cannot start generation: missing required configuration.";
      console.error(errorMessage, { topic, goal, selectedPersonas, selectedModel });
      set({ agentError: errorMessage });
      return;
    }

    set({
      currentStep: 'generating',
      isGenerating: true,
      agentError: null,
      liveHistory: [], // Clear any previous history
      finalPrompts: []
    });

    try {
      // --- THE REAL API CALL ---
      const response = await fetch('/api/generate', { // Assuming a new, dedicated endpoint for this
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, goal, personas: selectedPersonas, model: selectedModel }),
      });

      if (!response.ok || !response.body) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'The agent failed to start.');
      }

      // --- HANDLE THE STREAM ---
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let finalResult: GeneratedPrompt[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const event = JSON.parse(chunk) as AgentStreamEvent;

        // Add every event to our live history for the UI
        set(state => ({ liveHistory: [...state.liveHistory, event] }));

        // If this is the final 'result' event, save the payload
        if (event.type === 'result') {
          finalResult = event.payload.details as GeneratedPrompt[];
        }
      }

      set({
        finalPrompts: finalResult,
        isGenerating: false,
        currentStep: 'results' // Move to the final step!
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "The agent failed during execution.";
      console.error("Agent execution failed:", errorMessage);
      set({ isGenerating: false, agentError: errorMessage, currentStep: 'model' }); // Go back to the model step on error
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
      liveHistory: [], // Also clear history on reset
    });
  }
}));
